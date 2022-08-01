const { fanoutQueue } = require('service-claire/services/pubsub');
const { CLIENT_CREATED } = require('service-claire/events');
const { createClientPromise } = require('./controllers/clients');

const exchange = `${process.env.NODE_ENV || 'development'}.auth`;

fanoutQueue(exchange, 'service-users', (message) => {
  switch (message.event) {
    case CLIENT_CREATED:
      return createClientPromise(message.meta.raw);
    default:
    // Do nothing
  }
});
