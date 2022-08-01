const versionRouter = require('express-version-route');
const makeMap = require('service-claire/helpers/makeMap');
const authMiddleware = require('service-claire/middleware/auth');
const { weakAuthMiddleware } = require('service-claire/middleware/auth');
const pubsubMiddleware = require('service-claire/middleware/publish');
const rateLimitMiddleware = require('../rate-limits');
const cors = require('cors');
const v1_0 = require('../v1_0/controllers/clients');
const { createPublishClient } = require('../v1_0/publications');

const pubsubClientMiddleware = pubsubMiddleware(createPublishClient);

module.exports = (router) => {
  router.route('/clients')
    .options(cors())
    .get(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getClients,
        default: v1_0.getClients,
      }))
    );

  router.route('/clients/me')
    .options(cors())
    .put(
      cors(),
      rateLimitMiddleware,
      weakAuthMiddleware,
      pubsubClientMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.updateClient,
        default: v1_0.updateClient,
      }))
    );
};
