const schema = require('validate');
const inviteSchema = require('./invite');

const registrationSchema = schema({
  account: {
    name: {
      type: 'string',
      required: true,
      message: 'Your company\'s name is required',
    },
  },
  billing: {
    plan: {
      type: 'string',
      required: true,
      message: 'You must pick a plan',
    },
    addressLineOne: {
      type: 'string',
      required: false,
      message: 'An address is required',
    },
    addressLineTwo: {
      type: 'string',
      required: false,
    },
    city: {
      type: 'string',
      required: false,
      message: 'A city is required',
    },
    region: {
      type: 'string',
      required: false,
      message: 'A state, province, or region is required',
    },
    postalCode: {
      type: 'string',
      required: false,
      message: 'A ZIP or postal code is required',
    },
    stripeToken: {
      type: 'string',
      // Not required if the plan is free
      required: false,
    },
  },
  invites: {
    type: 'array',
    required: false,
    each: (d) => {
      return inviteSchema.validate(d);
    },
  },
  user: {
    email: {
      type: 'string',
      required: true,
      message: 'You must provide your email',
    },
    name: {
      type: 'string',
      required: true,
      message: 'You must provide your name',
    },
    password: {
      type: 'string',
      required: true,
      message: 'Your password must be at least 8 characters, and contain at least one number and letter.',
      // A minimum of eight characters, at least one letter and one number
      match: /^(?=.*[A-Za-z])(?=.*\d)(.+){8,}$/,
    },
  },
});

module.exports = registrationSchema;
