const express = require('express');
const bodyParser = require('body-parser');

const limits = require('./rate-limits');
const routes = require('./routes/index');
const { settings } = require('service-claire/helpers/config');
const helmet = require('service-claire/middleware/helmet');
const errorHandler = require('service-claire/middleware/errors');
const logger = require('service-claire/helpers/logger');

require('./v1_0/rpc');
require('./v1_0/subscription');

logger.register('b71f660c706067e7975eda67aff69c30');

const app = express();

app.enable('trust proxy');
app.use(helmet());
app.use(bodyParser.json());
app.use(limits);
app.use('/accounts', routes);
app.use(errorHandler);

const server = app.listen(
  settings.port,
  () => logger.log(`✅ 👭 service-users running on port ${settings.port}`)
);

module.exports = { app, server }; // For testing
