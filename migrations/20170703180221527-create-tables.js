module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Accounts',
      {
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
          type: Sequelize.ENUM('active', 'closed'),
          defaultValue: 'active',
        },

        plan: {
          type: Sequelize.ENUM('free', 'starter', 'premium'),
          defaultValue: 'free',
        },

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    ).then(() => {
      return queryInterface.createTable(
        'Teams',
        {
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
        }
      );
    }).then(() => {
      return queryInterface.createTable(
        'Users',
        {
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
        }
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('Users').then(() => {
      return queryInterface.dropTable('Teams');
    }).then(() => {
      return queryInterface.dropTable('Accounts');
    });
  },
};
