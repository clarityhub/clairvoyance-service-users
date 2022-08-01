module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Users',
      'meta',
      {
        type: Sequelize.JSONB,
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('Users', 'meta');
  },
};
