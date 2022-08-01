const versionRouter = require('express-version-route');
const makeMap = require('service-claire/helpers/makeMap');
const authMiddleware = require('service-claire/middleware/auth');
const { isAdminMiddleware, integrationMiddleware } = require('service-claire/middleware/auth');
const rpcMiddleware = require('service-claire/middleware/rpc');
const emailMiddleware = require('service-claire/middleware/email');
const billingMiddleware = require('service-claire/middleware/billing');
const { billingAccountMiddleware } = require('service-claire/middleware/billing');
const rateLimitMiddleware = require('../rate-limits');
const cors = require('cors');
const v1_0 = require('../v1_0/controllers/users');
const { planMiddleware } = require('service-claire/middleware/plans');
const { USER_READ } = require('service-claire/scopes');

const { oneSecondRateLimit } = rateLimitMiddleware;

module.exports = (router) => {
  router.route('/users/me')
    .options(cors())
    .get(
      cors(),
      rateLimitMiddleware,
      integrationMiddleware(USER_READ),
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getMe,
        default: v1_0.getMe,
      }))
    )
    .put(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.updateMe,
        default: v1_0.updateMe,
      }))
    );

  router.route('/users/me/meta')
    .options(cors())
    .get(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getMyMeta,
        default: v1_0.getMyMeta,
      }))
    )
    .patch(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.updateMyMeta,
        default: v1_0.updateMyMeta,
      }))
    );

  router.route('/users')
    .options(cors())
    .get(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getUsers,
        default: v1_0.getUsers,
      }))
    )
    .post(
      cors(),
      isAdminMiddleware,
      oneSecondRateLimit,
      rpcMiddleware,
      emailMiddleware,
      billingMiddleware,
      planMiddleware,
      billingAccountMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.createUser,
        default: v1_0.createUser,
      }))
    );

  router.route('/users/:uuid')
    .options(cors())
    .get(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getUser,
        default: v1_0.getUser,
      }))
    )
    .put(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.updateUser,
        default: v1_0.updateUser,
      }))
    )
    .delete(
      cors(),
      rateLimitMiddleware,
      isAdminMiddleware,
      rpcMiddleware,
      billingMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.deleteUser,
        default: v1_0.deleteUser,
      }))
    );
};
