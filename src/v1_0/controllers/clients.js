const pick = require('lodash/pick');
const {
  ok, notFound, badRequest, error,
} = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');
const { CLIENT_UPDATED } = require('service-claire/events');
const {
  Client,
} = require('../../models');

const getClients = async (req, res) => {
  const { accountId } = req.user;

  try {
    const clients = await Client.findAll({
      where: {
        accountId,
      },
      attributes: Client.cleanAttributes,
    });

    if (clients && clients.length > 0) {
      ok(res)({
        count: clients.length,
        items: clients,
      });
    } else {
      ok(res)({
        count: 0,
        items: [],
      });
    }
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const createClientPromise = ({
  id,
  uuid,
  knownCookies,
  accountId,
}) => {
  return Client.create({
    knownCookies,
    clientId: id,
    uuid,
    AccountId: accountId,
  }).then(() => {});
};

const updateClient = (req, res) => {
  const { clientId } = req.user;
  const { name, email } = req.body;

  // TODO allow people within the org to update the client

  if (name.trim() === '') {
    badRequest(res)({
      reason: 'You\'re name cannot be empty',
    });
    return;
  }

  if (email.trim() === '') {
    badRequest(res)({
      reason: 'You\'re email cannot be empty',
    });
  }

  Client.update({
    name,
    email,
  }, {
    where: {
      clientId,
    },
    returning: true,
  }).spread((count, results) => {
    if (count === 0) {
      notFound(res)();
      return;
    }

    const result = results[0];
    const clean = pick(result, Client.cleanAttributes);
    // send a message to the pubsub
    req.services.publish({
      event: CLIENT_UPDATED,
      ts: new Date(),
      meta: {
        raw: result,
        clean,
      },
    });

    ok(res)(clean);
  }).catch((err) => {
    logger.error(err);
    error(res)(err);
  });
};

// Called from RPC
const getClientPromise = (clientId) => {
  if (clientId === null) {
    return {
      type: 'error',
      reason: 'Invalid client id',
    };
  }

  return Client.findOne({
    where: {
      clientId,
    },
  }).then((client) => {
    return client;
  });
};

module.exports = {
  getClients,
  updateClient,
  getClientPromise,
  createClientPromise,
};
