module.exports = function (sequelize, Sequelize) {
  const Team = sequelize.define('Team', {
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
    },

    CreatorId: {
      type: Sequelize.BIGINT,
      references: {
        model: 'Accounts',
        key: 'id',
      },
      validate: {
        notEmpty: true,
      },
    },

    name: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: true,
      },
    },

    description: {
      type: Sequelize.STRING,
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

  Team.cleanAttributes = [
    'uuid',
    'name',
    'description',
    'createdAt',
    'updatedAt',
  ];

  Team.associate = function (models) {
    models.Account.Teams = models.Account.hasMany(Team);
    Team.Account = Team.belongsTo(models.Account);

    models.User.Teams = models.User.belongsToMany(Team, {
      through: models.TeamUsers,
    });
    Team.Users = Team.belongsToMany(models.User, {
      through: models.TeamUsers,
    });
  };

  return Team;
};
