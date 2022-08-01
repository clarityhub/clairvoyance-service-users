module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Clients',
      'clientId',
      {
        type: Sequelize.BIGINT,
        notEmpty: true,
        allowNull: false,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn(
      'Clients',
      'clientId'
    );
  },
};
