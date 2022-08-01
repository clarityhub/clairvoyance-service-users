module.exports = function (sequelize, Sequelize) {
  const User = sequelize.define('User', {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      validate: {
        notEmpty: true,
      },
    },

    AccountId: {
      type: Sequelize.BIGINT,
      references: {
        model: 'Accounts',
        key: 'id',
      },
      validate: {
        notEmpty: true,
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },

    name: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: true,
      },
    },

    email: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: true,
        isEmail: true,
      },
    },

    phoneNumber: Sequelize.STRING,
    nickname: Sequelize.STRING,
    bio: Sequelize.TEXT,
    meta: Sequelize.JSONB,

    CreatorId: {
      type: Sequelize.BIGINT,
      references: {
        model: 'Users',
        key: 'id',
      },
      validate: {
        notEmpty: true,
      },
    },

    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    deletedAt: Sequelize.DATE,
  }, {
    timestamps: true,
    paranoid: true,
  });

  User.updatableAttributes = [
    // TODO allow email to be updated 'email',
    'name',
    'phoneNumber',
    'nickname',
    'bio',
  ];

  User.cleanAttributes = [
    'uuid',
    'name',
    'email',
    'phoneNumber',
    'nickname',
    'bio',
    'createdAt',
  ];

  User.associate = function (models) {
    models.Account.Users = models.Account.hasMany(User);
    User.Account = User.belongsTo(models.Account);
  };

  return User;
};
