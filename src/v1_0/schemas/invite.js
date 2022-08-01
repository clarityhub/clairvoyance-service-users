const schema = require('validate');

const inviteSchema = schema({
  name: {
    type: 'string',
    required: true,
    message: 'You must provide a name for your invite',
  },
  email: {
    type: 'string',
    required: true,
    message: 'You must provide an email for your invite',
  },
});

module.exports = inviteSchema;
