module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'TeamUsers',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        UserId: {
          type: Sequelize.BIGINT,
        },
        TeamId: {
          type: Sequelize.BIGINT,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('TeamUsers');
  },
};
