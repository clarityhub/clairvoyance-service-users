const logger = require('service-claire/helpers/logger');

const exchange = `${process.env.NODE_ENV || 'development'}.clients`;

const createPublishClient = (connection) => {
  let channel;

  connection.then((c) => {
    return c.createChannel();
  }).then((ch) => {
    return ch.assertExchange(exchange, 'fanout', { durable: false }).then(() => {
      channel = ch;
    });
  }).catch(logger.error);

  const publishData = (data, attempt = 0) => {
    if (attempt < 4 && (channel === null || typeof channel === 'undefined')) {
      setTimeout(publishData.bind(this, data, attempt + 1), 100);
      return;
    }

    channel.publish(exchange, '', Buffer.from(JSON.stringify(data)));
  };

  return publishData;
};

module.exports = {
  createPublishClient,
};
