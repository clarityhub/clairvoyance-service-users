const { subscribe, unsubscribe } = require('service-claire/rpc/listen');
const { getUserPromise, getUsersPromise } = require('./controllers/users');
const { getClientPromise } = require('./controllers/clients');

subscribe('getUser', (data) => {
  const { meta } = data;

  const { userId, clientId } = meta;

  if (userId) {
    return getUserPromise(userId);
  } else if (clientId) {
    return getClientPromise(clientId);
  }
  return {
    type: 'error',
    reason: 'Unsupported type',
  };
});

subscribe('getUsers', (data) => {
  const { meta } = data;

  const { accountId } = meta;

  if (accountId) {
    return getUsersPromise(accountId);
  }

  return {
    type: 'error',
    reason: 'Unsupported type',
  };
});

process.on('exit', () => {
  unsubscribe('getUser');
  unsubscribe('getUsers');
});
