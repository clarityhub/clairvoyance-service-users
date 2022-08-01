const chai = require('chai');

const { expect } = chai;

const { connect } = require('service-claire/services/pubsub');
const { subscribe, unsubscribe } = require('service-claire/rpc/listen');
const InjectInterface = require('service-claire/test/helpers/inject');
const { COMMAND_BILLING_CREATE, COMMAND_EMAIL_SEND } = require('service-claire/events');
const { app } = require('../../src/index');
const accountSeed = require('../../seeders/20170703183430602-shrimppimp-account');
const {
  Account,
  User,
} = require('../../src/models');
const limits = require('../../src/rate-limits');

const { oneSecondRateLimit } = limits;

const emailExchange = 'test.email';
const billingExchange = 'test.billing';

describe('Register 1.0', () => {
  before((done) => {
    InjectInterface(accountSeed.down)
      .then(() => done())
      .catch(done);
  });

  beforeEach((done) => {
    oneSecondRateLimit.resetKey('::ffff:127.0.0.1');
    limits.resetKey('::ffff:127.0.0.1');

    setTimeout(done, 50);
  });

  describe('A user signs up with all the correct information and ' +
           'invites part of their team', () => {
    let response = null;
    let called = false;
    let emailChannel = null;
    let emailQueue = null;
    let callCount = 0;
    let billingChannel = null;
    let billingQueue = null;

    before((done) => {
      callCount = 0;

      connect.then(async (connection) => {
        const ch = await connection.createChannel();
        ch.assertExchange(emailExchange, 'fanout', { durable: false });
        const q = await ch.assertQueue('', { exclusive: true });
        await ch.bindQueue(q.queue, emailExchange, '');

        emailQueue = q;
        emailChannel = ch;

        const bch = await connection.createChannel();
        bch.assertExchange(billingExchange, 'fanout', { durable: false });
        const q2 = await bch.assertQueue('', { exclusive: true });
        await bch.bindQueue(q2.queue, billingExchange, '');

        billingChannel = bch;
        billingQueue = q2;

        subscribe('createAuthBulk', (allUsers) => {
          called = true;
          return allUsers.map(a => ({
            jwt: '1234',
            uuid: a.uuid,
          }));
        });

        subscribe('getPlans', () => {
          return {
            free: {},
          };
        });

        subscribe('createDefaultIntegrations', () => {
          return {};
        });

        // Give the subscriptions some time to connect
        setTimeout(() => {
          chai.request(app)
            .post('/accounts/register')
            .set({
              'X-Api-Version': '1.0',
            })
            .send({
              account: {
                name: 'Clarity Hub, Inc',
              },
              billing: {
                plan: 'free',
                addressLineOne: '7520 S 13th Pl',
                addressLineTwo: '',
                city: 'Phoenix',
                region: 'AZ',
                postalCode: '85042',
                stripeToken: '12341234',
              },
              invites: [
                {
                  name: 'Anna Loukianova',
                  email: 'aloukianova@clarityhub.io',
                },
                {
                  name: 'Daniela Howe',
                  email: 'daniela@clarityhub.io',
                },
              ],
              user: {
                email: 'ivan@clarityhub.io',
                password: 'testing123',
                name: 'Ivan Montiel',
              },
            })
            .end((err, resp) => {
              if (err) {
                console.log(err, resp);
                done(err);
                return;
              }

              response = resp;
              done();
            });
        }, 100);
      });
    });

    after((done) => {
      unsubscribe('createAuthBulk');
      unsubscribe('getPlans');

      emailChannel.close();
      billingChannel.close();

      done();
    });

    it('creates an account, team, and users', (done) => {
      Account.findOne({
        name: 'Clarity Hub, Inc',
      }).then((result) => {
        expect(result.name).to.be.equal('Clarity Hub, Inc');

        User.findAll({
          where: {
            email: {
              $in: [
                'ivan@clarityhub.io',
                'aloukianova@clarityhub.io',
                'daniela@clarityhub.io',
              ],
            },
          },
        }).then((results) => {
          expect(results).to.be.length(3);

          done();
        });
      });
    });

    it('sends an RPC request to auth', () => {
      expect(called).to.be.true;
    });

    it('sends an onboarding email requests to the users who signed up', (done) => {
      emailChannel.consume(emailQueue.queue, (msg) => {
        const message = JSON.parse(msg.content.toString());

        callCount += 1;

        if (message.event === COMMAND_EMAIL_SEND) {
          expect([
            'ivan@clarityhub.io',
            'aloukianova@clarityhub.io',
            'daniela@clarityhub.io',
          ]).to.contain(message.meta.to);

          if (message.meta.to === 'ivan@clarityhub.io') {
            expect(message.meta.template).to.be.equal('onboarding');
          } else {
            expect(message.meta.template).to.be.equal('invite');
          }
        }

        if (callCount === 3) {
          done();
        }
      }, { noAck: true });
    });

    it('it sends a billing request with the billing information', (done) => {
      billingChannel.consume(billingQueue.queue, (msg) => {
        const message = JSON.parse(msg.content.toString());
        if (message.event === COMMAND_BILLING_CREATE) {
          expect(message.meta.name).to.be.equal('Clarity Hub, Inc');
          expect(message.meta.accountId).to.not.be.empty;
          expect(message.meta.stripeToken).to.be.equal('12341234');
          expect(message.meta.seats).to.be.equal(3);
          done();
        }
      });
    });

    it('sends a JWT back', () => {
      expect(response.body.jwt).to.not.be.empty;
      expect(response.body.jwt).to.be.equal('1234');
    });
  });

  describe('The user sends malformed request', () => {
    before(() => {
      subscribe('createAuthBulk', (allUsers) => {
        return allUsers.map(a => ({
          jwt: '1234',
          uuid: a.uuid,
        }));
      });
      subscribe('getPlans', () => {
        return {
          free: {},
        };
      });
    });

    after(() => {
      unsubscribe('createAuthBulk');
      unsubscribe('getPlans');
    });

    it('responds with an error if data is malformed', (done) => {
      chai.request(app)
        .post('/accounts/register')
        .set({
          'X-Api-Version': '1.0',
        })
        .send({
          account: {
            name: 'Clarity Hub, Inc',
          },
          billing: {
            plan: 'starter',
            addressLineOne: '7520 S 13th Pl',
            addressLineTwo: '',
            city: 'Phoenix',
            region: 'AZ',
            postalCode: '85042',
            stripeToken: '12341234',
          },
          user: {
            password: 'testing123',
            name: 'Ivan Montiel',
          },
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(400);

          done();
        });
    });
  });

  describe('The user attempts more than 1 request in a second', () => {
    // before(() => {
    //   subscribe('getPlans', () => {
    //     return {
    //       free: {},
    //     };
    //   });
    // });

    // after(() => {
    //   unsubscribe('getPlans');
    // });

    /*
     * Skipping the rate limit tests
     * I regret adding them in
     * - Ivan
     */
    it.skip('rate limits requests to 1 a second', (done) => {
      chai.request(app)
        .post('/accounts/register')
        .set({
          'X-Api-Version': '1.0',
        })
        .send({
        })
        .end(() => {
          chai.request(app)
            .post('/accounts/register')
            .set({
              'X-Api-Version': '1.0',
            })
            .send({
            })
            .end((err, resp) => {
              expect(resp.status).to.be.equal(429);

              done();
            });
        });
    });
  });

  describe('🔥 Failure cases', () => {
    it('responds with an error if auth fails to respond to the RPC request', (done) => {
      chai.request(app)
        .post('/accounts/register')
        .set({
          'X-Api-Version': '1.0',
        })
        .send({
          account: {
            name: 'Clarity Hub, Inc',
          },
          billing: {
            plan: 'starter',
            addressLineOne: '7520 S 13th Pl',
            addressLineTwo: '',
            city: 'Phoenix',
            region: 'AZ',
            postalCode: '85042',
            stripeToken: '12341234',
          },
          user: {
            email: 'ivan+3@clarityhub.io',
            password: 'testing123',
            name: 'Ivan Montiel',
          },
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(500);

          done();
        });
    });

    it.skip('responds with an error if the user has already created an account with their email', (done) => {
      done({ error: 'Not implemented' });
    });

    // XXX need to ask everyone about this
    it.skip('???? when a user tries to invite someone that already exists in the system', (done) => {
      done({ error: 'Not implemented' });
    });
  });
});
