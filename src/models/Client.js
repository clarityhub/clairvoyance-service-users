module.exports = function (sequelize, Sequelize) {
  const Client = sequelize.define('Client', {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    // The clientId stored in service-auth,
    clientId: {
      type: Sequelize.BIGINT,
      notEmpty: true,
      allowNull: false,
    },

    uuid: {
      type: Sequelize.UUID,
    },

    knownCookies: Sequelize.ARRAY(Sequelize.STRING),

    AccountId: {
      type: Sequelize.BIGINT,
      notEmpty: true,
      allowNull: false,
    },

    email: {
      type: Sequelize.STRING,
      validate: {
        isEmail: true,
      },
    },

    name: Sequelize.STRING,

    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    deletedAt: Sequelize.DATE,
  }, {
    indexes: [
      {
        unique: true,
        fields: ['knownCookies'],
      },
    ],
    timestamps: true,
    paranoid: true,
  });

  Client.cleanPrivateAttributes = [
    'name',
    'email',
    'createdAt',
    'updatedAt',
  ];

  Client.cleanAttributes = [
    'createdAt',
    'updatedAt',
  ];

  Client.associate = function (models) {
    models.Account.Clients = models.Account.hasMany(Client);
    Client.Account = Client.belongsTo(models.Account);
  };

  return Client;
};
