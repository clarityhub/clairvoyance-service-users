const versionRouter = require('express-version-route');
const makeMap = require('service-claire/helpers/makeMap');
const cors = require('cors');

const { oneSecondRateLimit } = require('../rate-limits');
const v1_0 = require('../v1_0/controllers/email');

module.exports = (router) => {
  router.route('/email/available')
    .options(cors())
    .post(
      cors(),
      oneSecondRateLimit,
      versionRouter.route(makeMap({
        '1.0': v1_0.available,
        default: v1_0.available,
      }))
    );
};
