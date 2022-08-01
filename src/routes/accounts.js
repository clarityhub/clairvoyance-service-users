const versionRouter = require('express-version-route');
const makeMap = require('service-claire/helpers/makeMap');
const authMiddleware = require('service-claire/middleware/auth');
const { isAdminMiddleware } = require('service-claire/middleware/auth');
const rateLimitMiddleware = require('../rate-limits');
const cors = require('cors');
const v1_0 = require('../v1_0/controllers/accounts');


module.exports = (router) => {
  router.route('/me')
    .options(cors())
    .get(
      cors(),
      rateLimitMiddleware,
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getMyAccount,
        default: v1_0.getMyAccount,
      }))
    )
    .put(
      cors(),
      rateLimitMiddleware,
      isAdminMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.updateMyAccount,
        default: v1_0.updateMyAccount,
      }))
    );
};
