const {
  ACTIVE,
  CLOSED,
} = require('../constants/statuses');

module.exports = function (sequelize, Sequelize) {
  const Account = sequelize.define('Account', {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      valdiate: {
        notEmpty: true,
      },
    },

    creatorId: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },

    ownerId: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    status: {
      type: Sequelize.ENUM(ACTIVE, CLOSED),
      defaultValue: ACTIVE,
    },

    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    deletedAt: Sequelize.DATE,
  }, {
    timestamps: true,
    paranoid: true,
  });

  Account.updatableAttributes = [
    'name',
    'ownerId',
  ];

  Account.cleanAttributes = [
    'uuid',
    'name',
    'createdAt',
    'updatedAt',
  ];

  return Account;
};
