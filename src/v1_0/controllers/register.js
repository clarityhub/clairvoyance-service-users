const { badRequest, error, ok } = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');
const registrationSchema = require('../schemas/registration');

const {
  Account,
  User,
} = require('../../models');

/**
XXX refactor this is insane
Register the new account

1. Validate the given data
2. Create an account
3. Create the user
4. Create users (invited)
5. RPC to auth
  5a. Success:
    6. Send Onboarding Email
    7. Send Invite emails
    8. Send Billing information
    9. Respond with Login URL + Auth JWT
  5b. Failure:
    X. Respond with a message: failure, but not billed

*/
const register = async (req, res) => {
  const { plans } = req;

  const {
    account, billing, invites, user,
  } = req.body;

  const errors = registrationSchema.validate(req.body);

  if (errors && errors.length > 0) {
    return badRequest(res)({
      reason: errors[0].message,
    });
  }

  let createdAccount = null;

  const trialDetails = {
    trialPlan: 'trial',
    trialLength: 30, // 30 days
    trialStart: (new Date()).toISOString(),
  };

  try {
    const t = await Account.sequelize.transaction();
    const userExists = await User.findOne({
      where: {
        email: user.email,
      },
      transaction: t,
    });

    // check that the other emails aren't taken either
    if (invites && invites.length > 0) {
      const inviteExists = await User.findAll({
        where: {
          email: {
            $any: invites.map(invite => invite.email),
          },
        },
      });

      if (inviteExists && inviteExists.length > 0) {
        return badRequest(res)({
          reason: `The following emails were already taken: ${inviteExists.map(invite => invite.email).join(', ')}`,
        });
      }
    }

    if (userExists) {
      return badRequest(res)({
        reason: 'User exists!',
      });
    }

    if (!plans[billing.plan]) {
      return badRequest(res)({
        reason: `${billing.plan} is not a valid plan`,
      });
    }

    if (invites) {
      const realPlan = plans[billing.plan];
      if (invites.length + 1 > realPlan.availableSeats) {
        return badRequest(res)({
          reason: `${realPlan.name} does not allow ${invites.length + 1} seats`,
        });
      }
    }

    createdAccount = await Account.create({
      name: account.name,
      creatorId: -1,
      ownerId: -1,
    }, {
      returning: true,
      transaction: t,
    });

    const createdUser = await User.create({
      name: user.name,
      email: user.email,
      AccountId: createdAccount.id,
    }, {
      returning: true,
      transaction: t,
    });
    // XXX update the account's creatorId and ownerId with the user id

    let createdInvites = null;

    if (invites) {
      const transformedInvites = invites.map((invite) => {
        return {
          name: invite.name,
          email: invite.email,
          AccountId: createdAccount.id,
        };
      });

      createdInvites = await User.bulkCreate(transformedInvites, {
        returning: true,
        transaction: t,
      });
    }

    /*
     * Complete post-registration tasks like emails
     */

    const transformedUser = Object.assign(
      {},
      createdUser.get({ plain: true }),
      {
        password: user.password,
        privilege: 'admin',
      }
    );

    let transformedInvites = [];
    if (createdInvites) {
      transformedInvites = createdInvites.map(i => i.get({ plain: true }));
    }

    const allUsers = []
      .concat(transformedUser, transformedInvites)
      .map((u) => {
        return {
          uuid: u.uuid,
          userId: u.id,
          email: u.email,
          password: u.password,
          accountId: createdAccount.id,
          privilege: u.privilege || null,
          // trial length
          // trial start date
          plan: trialDetails.trialPlan,
          trialLength: trialDetails.trialLength,
          trialStart: trialDetails.trialStart,
        };
      });

    const response = await req.services.rpc.call('createAuthBulk', allUsers);
    req.services.email.send({
      to: user.email,
      subject: 'Welcome to Clarity Hub!',
      template: 'onboarding',
      data: {
        name: user.name,
        accountName: account.name,
      },
    });

    if (createdInvites) {
      createdInvites.forEach((i) => {
        const { resetPasswordUuid } = response.find(j => j.uuid === i.uuid);
        // Send invite email
        req.services.email.send({
          to: i.email,
          subject: `${user.name} has invited you to Clarity Hub!`,
          template: 'invite',
          data: {
            name: i.name,
            accountName: account.name,
            inviterEmail: user.email,
            inviterName: user.name,
            uuid: resetPasswordUuid,
          },
        });
      });
    }

    // Send billing
    await req.services.billing.create({
      name: createdAccount.name,
      accountId: createdAccount.id,
      stripeToken: billing.stripeToken,
      addressLineOne: billing.addressLineOne,
      addressLineTwo: billing.addressLineTwo,
      city: billing.city,
      region: billing.region,
      postalCode: billing.postalCode,
      seats: allUsers.length,
      email: user.email,
      // trial length
      // trial start date
      plan: trialDetails.trialPlan,
      trialLength: trialDetails.trialLength,
      trialStart: trialDetails.trialStart,
    });

    await req.services.rpc.call('createDefaultIntegrations', { accountId: createdAccount.id, userId: createdUser.id });

    await t.commit();
    // XXX check that the jwt we are getting back is the one for
    // the user who signed up
    ok(res)({
      jwt: response[0].jwt,
    });
  } catch (err) {
    logger.error(err);
    // Could not log in, will not continue to bill.
    // Will log as critical
    error(res)({
      reason: 'We could not process your request at this time. Don\'t worry, you have not been billed.',
    });
  }
};

module.exports = {
  register,
};
