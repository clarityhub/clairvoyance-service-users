const chai = require('chai');

const { expect } = chai;

const { connect } = require('service-claire/services/pubsub');
const { subscribe, unsubscribe } = require('service-claire/rpc/listen');
const InjectInterface = require('service-claire/test/helpers/inject');
const { app } = require('../../src/index');
const accountSeed = require('../../seeders/20170703183430602-shrimppimp-account');
const { createToken } = require('service-claire/helpers/tokens');
const { createForgery } = require('service-claire/test/helpers/forgery');

const {
  User,
} = require('../../src/models');

const billingExchange = 'test.billing';

describe('Users 1.0', () => {
  before((done) => {
    InjectInterface(accountSeed.down)
      .then(() => {
        return InjectInterface(accountSeed.up)
          .then(() => done());
      })
      .catch(done);
  });

  describe('GET /accounts/users/me', () => {
    let user = null;

    before((done) => {
      User.findOne({
        where: {
          email: 'shrimper-test@clarityhub.io',
        },
      }).then((u) => {
        user = u;
        done();
      });
    });

    it('gets my own user account', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      chai.request(app)
        .get('/accounts/users/me')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.email).to.be.equal(user.email);
          expect(resp.body.name).to.be.equal(user.name);
          expect(resp.body).to.not.have.all.keys('deletedAt');

          done();
        });
    });

    it('returns forbidden if the credentials are invalid', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      // Forge the token
      const forgery = createForgery(token);

      chai.request(app)
        .get('/accounts/users/me')
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });
  });

  describe('PUT /accounts/users/me', () => {
    let user = null;

    before((done) => {
      User.findOne({
        where: {
          email: 'shrimper-test@clarityhub.io',
        },
      }).then((u) => {
        user = u;
        done();
      });
    });

    it('updates the user with clean attributes', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      chai.request(app)
        .put('/accounts/users/me')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .send({
          name: 'Daniel McDan',
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.email).to.be.equal(user.email);
          expect(resp.body.name).to.not.be.equal(user.name);
          expect(resp.body.name).to.be.equal('Daniel McDan');
          done();
        });
    });

    it('returns forbidden if the credentials are invalid', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      // Forge the token
      const forgery = createForgery(token);

      chai.request(app)
        .put('/accounts/users/me')
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .send({
          name: 'Daniel McDan',
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });
  });

  describe('GET /accounts/users', () => {
    let user = null;

    before((done) => {
      User.findOne({
        where: {
          email: 'shrimper-test@clarityhub.io',
        },
      }).then((u) => {
        user = u;
        done();
      });
    });

    it('gets users in my account', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      chai.request(app)
        .get('/accounts/users')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.users).to.be.an('array');
          expect(resp.body.users).to.be.length(2);

          done();
        });
    });

    it('returns only users in a given account', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: '14124',
      });

      chai.request(app)
        .get('/accounts/users')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.users).to.be.an('array');
          expect(resp.body.users).to.be.length(0);

          done();
        });
    });

    it('returns forbidden if the credentials are invalid', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      // Forge the token
      const forgery = createForgery(token);

      chai.request(app)
        .get('/accounts/users')
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });
  });

  describe('GET /accounts/users/:uuid', () => {
    let user = null;

    before((done) => {
      User.findOne({
        where: {
          email: 'shrimper-test@clarityhub.io',
        },
      }).then((u) => {
        user = u;
        done();
      });
    });

    it('gets my own user account', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      chai.request(app)
        .get(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.email).to.be.equal(user.email);
          expect(resp.body.name).to.be.equal(user.name);
          expect(resp.body).to.not.have.all.keys('deletedAt');

          done();
        });
    });

    it('returns forbidden if the credentials are invalid', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      // Forge the token
      const forgery = createForgery(token);

      chai.request(app)
        .get(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });
  });

  describe.skip('POST /accounts/users', () => {
    let user = null;

    before((done) => {
      User.findOne({
        where: {
          email: 'shrimper-test@clarityhub.io',
        },
      }).then((u) => {
        user = u;
        done();
      });
    });
    // XXX need to mock services billing, email, rpc
    it('returns payment required when making a user from an expired account', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
        privilege: 'admin',
        trialStatus: {
          status: 'trial',
          trialIsExpired: true,
        },
      });

      chai.request(app)
        .post('/accounts/users')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(402);
          expect(resp.body.code).to.be.equal('Payment Required');

          done();
        });
    });
  });

  describe('PUT /accounts/users/:uuid', () => {
    let user = null;

    before((done) => {
      User.findOne({
        where: {
          email: 'shrimper-test@clarityhub.io',
        },
      }).then((u) => {
        user = u;
        done();
      });
    });

    it('updates the user with clean attributes', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        privilege: 'admin',
        accountId: user.AccountId,
      });

      chai.request(app)
        .put(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .send({
          name: 'Daniel mcmenamins',
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.email).to.be.equal(user.email);
          expect(resp.body.name).to.not.be.equal(user.name);
          expect(resp.body.name).to.be.equal('Daniel mcmenamins');
          done();
        });
    });

    it('returns forbidden when not an admin', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      chai.request(app)
        .put(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .send({
          name: 'Daniel McDan',
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });

    it('returns forbidden if the credentials are invalid', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      // Forge the token
      const forgery = createForgery(token);

      chai.request(app)
        .put(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .send({
          name: 'Daniel McDan',
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });
  });

  describe('DELETE /accounts/users/:uuid', () => {
    let user = null;
    let called = false;
    let billingChannel = null;

    before((done) => {
      connect.then(async (connection) => {
        const bch = await connection.createChannel();
        bch.assertExchange(billingExchange, 'fanout', { durable: false });
        const q2 = await bch.assertQueue('', { exclusive: true });
        await bch.bindQueue(q2.queue, billingExchange, '');

        billingChannel = bch;

        subscribe('deleteAuth', ({ accountId, userId }) => {
          expect(accountId).to.not.be.null;
          expect(userId).to.not.be.null;
          called = true;
          return {};
        });
        return {};
      }).then(() => {
        User.findOne({
          where: {
            email: 'shrimper-test@clarityhub.io',
          },
        }).then((u) => {
          user = u;
          done();
        });
      });
    });

    after((done) => {
      unsubscribe('deleteAuth');

      billingChannel.close();

      done();
    });

    it('can delete an account', (done) => {
      // Create a token
      const token = createToken({
        userId: '10010010',
        email: user.email,
        status: 'active',
        privilege: 'admin',
        accountId: user.AccountId,
      });

      chai.request(app)
        .delete(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(called).to.be.true;
          done();
        });
    });

    it('returns forbidden if not privileged', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      chai.request(app)
        .delete(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });

    it('returns forbidden if the credentials are invalid', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      // Forge the token
      const forgery = createForgery(token);

      chai.request(app)
        .delete(`/accounts/users/${user.uuid}`)
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(403);
          expect(resp.body).to.be.an('object');
          expect(resp.body.reason).to.not.be.empty;
          expect(resp.body.code).to.be.equal('Forbidden');

          done();
        });
    });
  });
});
