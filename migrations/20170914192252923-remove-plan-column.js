module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeColumn(
      'Accounts',
      'plan'
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'Accounts',
      'plan',
      {
        type: Sequelize.ENUM('free', 'starter', 'premium'),
        defaultValue: 'free',
      }
    );
  },
};
