const {
  ok, badRequest, notFound, error, forbidden,
} = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');
const {
  User,
} = require('../../models');
const pick = require('lodash/pick');

const getMe = (req, res) => {
  const { userId } = req.user;

  if (userId === null) {
    return error(res)({
      reason: 'Your JWT is invalid',
    });
  }

  User.findOne({
    where: {
      id: userId,
    },
  }).then((user) => {
    if (user) {
      const cleanUser = pick(user, User.cleanAttributes);
      return ok(res)(cleanUser);
    }
    return notFound(res)({});
  }).catch((err) => {
    logger.error(err);
    error(res)(err);
  });
};

const getMyMeta = async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (user) {
      return ok(res)(user.meta || {});
    }

    return notFound(res)({});
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const updateMe = (req, res) => {
  const { userId } = req.user;
  const cleanItems = pick(req.body, User.updatableAttributes);

  User.update(cleanItems, {
    where: {
      id: userId,
    },
    limit: 1,
    returning: true,
  }).then(([count, users]) => {
    if (users && count === 1) {
      // XXX we need to tell auth if the email updated
      const cleanUser = pick(users[0], User.cleanAttributes);
      return ok(res)(cleanUser);
    }
    return notFound(res)({
      reason: 'User not found',
    });
  }).catch((err) => {
    logger.error(err);
    error(res)(err);
  });
};

const updateMyMeta = async (req, res) => {
  const { userId } = req.user;
  const newMeta = req.body;

  if (userId === null) {
    return error(res)({
      reason: 'Your JWT is invalid',
    });
  }

  try {
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    const meta = Object.assign({}, user.meta);

    if (user) {
      for (const [key, value] of Object.entries(newMeta)) {
        if (value === null) {
          delete meta[key];
        } else {
          meta[key] = value;
        }
      }

      await User.update({
        meta,
      }, {
        where: {
          id: userId,
        },
      });

      return ok(res)(meta);
    }

    return notFound(res)({});
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const getUsers = (req, res) => {
  const { accountId } = req.user;

  User.findAll({
    where: {
      AccountId: accountId,
    },
  }, {
    attributes: {
      include: User.cleanAttributes,
    },
  }).then((users) => {
    return ok(res)({ users: users.map(user => pick(user, User.cleanAttributes)) });
  }).catch((err) => {
    logger.error(err);
    error(res)(err);
  });
};

const getUser = (req, res) => {
  const { accountId } = req.user;
  const { uuid } = req.params;

  User.findOne({
    where: {
      uuid,
      AccountId: accountId,
    },
  }).then((user) => {
    if (user) {
      const cleanUser = pick(user, User.cleanAttributes);
      return ok(res)(cleanUser);
    }

    return notFound(res)();
  }).catch((err) => {
    logger.error(err);
    error(res)(err);
  });
};

const createUser = async (req, res) => {
  const { plan } = req;
  const { accountId, userId } = req.user;
  const {
    name,
    email,
    password,
  } = req.body;

  if (!name || name.trim() === '') {
    return badRequest(res)({
      reason: 'A name is required',
    });
  }

  if (!email || email.trim() === '') {
    return badRequest(res)({
      reason: 'An email is required',
    });
  }

  try {
    const creatingUser = await User.findOne({
      where: {
        id: userId,
      },
    });
    const accountUsers = await User.findAll({
      where: {
        AccountId: accountId,
      },
    });

    if (accountUsers.length + 1 > plan.availableSeats) {
      return badRequest(res)({
        reason: `You've run out of seats for your plan. You have used all ${plan.availableSeats} seats.`,
      });
    }

    const foundUser = await User.findOne({
      where: {
        email,
      },
    });

    if (foundUser) {
      return badRequest(res)({
        reason: 'That email is already being used by a user',
      });
    }

    const user = await User.create({
      name,
      email,
      AccountId: accountId,
    }, {
      returning: true,
    });

    // Update billing
    req.services.billing.addSeat({
      accountId,
    });

    const authUser = Object.assign(
      {},
      user.get({ plain: true }),
      {
        accountId: user.AccountId,
        userId: user.id,
      }
    );

    if (password) {
      authUser.password = password;
    }

    // if this fails, roll back!!!
    return req.services.rpc.call('createAuthBulk', [authUser]).then((response) => {
      req.services.email.send({
        to: user.email,
        subject: `${creatingUser.name} has invited you to Clarity Hub!`,
        template: password ? 'new-user' : 'invite',
        data: {
          name: user.name,
          inviterEmail: creatingUser.email,
          inviterName: creatingUser.name,
          uuid: response[0].resetPasswordUuid,
        },
      });

      ok(res)(pick(user, User.cleanAttributes));
    }).catch((err) => {
      // We need to roll back!
      logger.error(err);
      req.services.billing.removeSeat({
        accountId,
      });
      return User.destroy({
        where: {
          id: user.id,
        },
      }).then(() => {
        error(res)({
          reason: 'Something bad happened',
        });
      });
    });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const updateUser = (req, res) => {
  const { accountId, uuid: userUuid, privilege } = req.user;
  const { uuid } = req.params;

  if (userUuid !== uuid && privilege !== 'admin') {
    return forbidden(res)({
      reason: 'You must be an admin to perform this action',
    });
  }

  const cleanItems = pick(req.body, User.updatableAttributes);

  User.update(cleanItems, {
    where: {
      uuid,
      AccountId: accountId,
    },
    limit: 1,
    returning: true,
  }).then(([count, users]) => {
    if (users && count === 1) {
      // XXX we need to tell auth if the email updated
      const cleanUser = pick(users[0], User.cleanAttributes);
      return ok(res)(cleanUser);
    }
    return badRequest(res)({
      reason: 'User not found',
    });
  }).catch((err) => {
    logger.error(err);
    error(res)(err);
  });
};

const deleteUser = async (req, res) => {
  const { userId, accountId } = req.user;
  const { uuid } = req.params;

  try {
    const user = await User.findOne({
      where: {
        uuid,
        AccountId: accountId,
      },
    });

    if (!user) {
      return notFound(res)({
        reason: 'That user could not be found',
      });
    }

    if (user.id === userId) {
      // You CANNOT delete yourself, which
      // will always ensure that there is an admin
      // since only admins can delete users
      return badRequest(res)({
        reason: 'You cannot delete your own user',
      });
    }

    // Tell the other services that the account has been deleted.
    // NOTE this needs to be carefully choreographed, if billing fails, we
    // need to tell deleteAuth to rollback, etc
    await req.services.rpc.call('deleteAuth', { accountId, userId: user.id });
    await req.services.billing.removeSeat({ accountId });
    await User.destroy({
      where: {
        uuid,
        AccountId: accountId,
      },
    });
    ok(res)({});
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

// Called from RPC
const getUserPromise = (userId) => {
  if (userId === null) {
    return {
      type: 'error',
      reason: 'Invalid user id',
    };
  }

  return User.findOne({
    where: {
      id: userId,
    },
  }).then((user) => {
    return user;
  });
};

const getUsersPromise = (accountId) => {
  if (accountId === null) {
    return {
      type: 'error',
      reason: 'Invalid user id',
    };
  }

  return User.findAll({
    where: {
      AccountId: accountId,
    },
  }).then((users) => {
    return users;
  });
};

module.exports = {
  getMe,
  getMyMeta,
  updateMe,
  updateMyMeta,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserPromise,
  getUsersPromise,
};
