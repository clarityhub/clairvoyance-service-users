module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Clients',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },

        knownCookies: Sequelize.ARRAY(Sequelize.STRING),

        email: {
          type: Sequelize.STRING,
          validate: {
            isEmail: true,
          },
        },

        name: Sequelize.STRING,

        AccountId: {
          type: Sequelize.BIGINT,
          references: {
            model: 'Accounts',
            key: 'id',
          },
          validate: {
            notEmpty: true,
            allowNull: false,
          },
        },

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Clients');
  },
};
