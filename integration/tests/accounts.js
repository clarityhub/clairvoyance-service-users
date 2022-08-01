const chai = require('chai');

const { expect } = chai;

const InjectInterface = require('service-claire/test/helpers/inject');
const { app } = require('../../src/index');
const accountSeed = require('../../seeders/20170703183430602-shrimppimp-account');
const { createToken } = require('service-claire/helpers/tokens');
const { createForgery } = require('service-claire/test/helpers/forgery');

const {
  User,
} = require('../../src/models');

describe('Accounts 1.0', () => {
  before((done) => {
    InjectInterface(accountSeed.down)
      .then(() => {
        return InjectInterface(accountSeed.up)
          .then(() => done());
      })
      .catch(done);
  });

  describe('GET /accounts/me', () => {
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

    it('gets my own account', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        accountId: user.AccountId,
      });

      chai.request(app)
        .get('/accounts/me')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.name).to.be.equal('Shrimp Pimp');
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
        .get('/accounts/me')
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

  describe('PUT /accounts/me', () => {
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

    it('updates my own account if I am an admin', (done) => {
      // Create a token
      const token = createToken({
        userId: user.id,
        email: user.email,
        status: 'active',
        privilege: 'admin',
        accountId: user.AccountId,
      });

      chai.request(app)
        .put('/accounts/me')
        .set({
          'X-Api-Version': '1.0',
          token,
        })
        .send({
          name: 'New name',
        })
        .end((err, resp) => {
          expect(resp.status).to.be.equal(200);
          expect(resp.body.name).to.be.equal('New name');
          expect(resp.body).to.not.have.all.keys('deletedAt');

          done();
        });
    });

    it('returns forbidden if I am not an admin', (done) => {
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
        .put('/accounts/me')
        .set({
          'X-Api-Version': '1.0',
          token: forgery,
        })
        .send({
          name: 'New name',
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
        .put('/accounts/me')
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
