const shrimpPimpUUID = 'a51838a7-9a5b-4654-8377-30d6299340a3';
const spTeam1UUID = '4f06d00b-1417-4cf5-92aa-532acfb2016a';
const spUser1UUID = 'b286b92f-86ec-4690-9916-594eaa63fec0';
const spUser2UUID = 'bbe339b9-1780-439e-8eec-08da97a0f114';

module.exports = {
  up(queryInterface) {
    return queryInterface.bulkInsert('Accounts', [{
      uuid: shrimpPimpUUID,
      name: 'Shrimp Pimp',
      creatorId: -1,
      ownerId: -1,
    }], {
      returning: true,
    }).then((accounts) => {
      return queryInterface.bulkInsert('Teams', [{
        uuid: spTeam1UUID,
        AccountId: accounts[0].id,
        name: 'Shrimpin\' Team',
      }], {
        returning: true,
      }).then((/* teams */) => {
        return queryInterface.bulkInsert('Users', [{
          uuid: spUser1UUID,
          name: 'Long John Shrimper',
          email: 'shrimper-test@clarityhub.io',
          nickname: 'Ol\' Shrimpy',
          AccountId: accounts[0].id,
        }, {
          uuid: spUser2UUID,
          name: 'Sela Pimper',
          email: 'pimper-test@clarityhub.io',
          AccountId: accounts[0].id,
        }]);

        // TODO add users to teams
      });
    });
  },

  down(queryInterface) {
    return queryInterface.bulkDelete('Teams', null, {}).then(() => {
      return queryInterface.bulkDelete('Users', null, {});
    }).then(() => {
      return queryInterface.bulkDelete('Accounts', null, {});
    });
  },
};
