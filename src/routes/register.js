const versionRouter = require('express-version-route');
const rpcMiddleware = require('service-claire/middleware/rpc');
const emailMiddleware = require('service-claire/middleware/email');
const billingMiddleware = require('service-claire/middleware/billing');
const makeMap = require('service-claire/helpers/makeMap');
const cors = require('cors');
const { plansMiddleware } = require('service-claire/middleware/plans');
const { oneSecondRateLimit } = require('../rate-limits');
const v1_0 = require('../v1_0/controllers/register');

module.exports = (router) => {
  router.route('/register')
    .options(cors())
    .post(
      cors(),
      oneSecondRateLimit,
      rpcMiddleware,
      emailMiddleware,
      billingMiddleware,
      plansMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.register,
        default: v1_0.register,
      }))
    );
};
