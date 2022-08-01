const { badRequest, error, ok } = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');

const {
  User,
} = require('../../models');

const available = (req, res) => {
  const { email } = req.body;

  if (typeof email !== 'string' || email.trim() === '') {
    badRequest(res)({
      reason: 'Invalid email',
    });
  }

  User.findOne({
    where: {
      email,
    },
  }).then((foundAUser) => {
    ok(res)({
      available: !foundAUser,
    });
  }).catch((err) => {
    logger.error(err);
    error(res)(err);
  });
};

module.exports = {
  available,
};
