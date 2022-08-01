const {
  ok, notFound, error,
} = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');
const {
  Account,
} = require('../../models');
const pick = require('lodash/pick');

const getMyAccount = async (req, res) => {
  const { accountId } = req.user;

  try {
    const account = await Account.findOne({
      where: {
        id: accountId,
      },
    });

    if (account) {
      const cleanAccount = pick(account, Account.cleanAttributes);
      return ok(res)(cleanAccount);
    }

    return notFound(res)({});
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const updateMyAccount = async (req, res) => {
  const { accountId } = req.user;
  const cleanItems = pick(req.body, Account.updatableAttributes);

  try {
    const [count, accounts] = await Account.update(cleanItems, {
      where: {
        id: accountId,
      },
      limit: 1,
      returning: true,
    });

    if (accounts && count === 1) {
      const cleanAccount = pick(accounts[0], Account.cleanAttributes);
      return ok(res)(cleanAccount);
    }

    return notFound(res)({
      reason: 'Account not found',
    });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

module.exports = {
  getMyAccount,
  updateMyAccount,
};
