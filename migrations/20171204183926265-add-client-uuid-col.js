module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Clients',
      'uuid',
      {
        type: Sequelize.UUID,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      'Clients',
      'uuid'
    );
  },
};
