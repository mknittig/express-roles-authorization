var Roles = require('../lib');
var expect = require('expect.js');

describe('Express roles authorization middleware', function () {

  var req, res, next, nextCalled;

  beforeEach(function () {
    res = {};
    nextCalled = false;
    next = function () {
      nextCalled = true;
    };
  });

  it('should check authorization and get permitted', function () {
    req = { method: 'GET', _parsedUrl: { pathname: '/needsspecficrole' } };
    var roles = new Roles({
      permissionsMapFile: __dirname +'/testconfig.json',
      authenticationFunction: function (req, res, next, cb) { cb(null, ['admin']) }
    });
    var authCheck = roles.checkAuth(req, res, next);
    expect(nextCalled).to.be.ok()
  });

  it('should check authorization and get denied', function () {
    req = { method: 'GET', _parsedUrl: { pathname: '/needsspecficrole' } };
    var sendCalled = false;
    res = {
      status: function (status) {
        expect(status).to.be(403);
        return this;
      },
      send: function (message) {
        sendCalled = true;
        expect(message).to.be('Permission denied!');
      }
    };
    var roles = new Roles({
      permissionsMapFile: __dirname +'/testconfig.json',
      authenticationFunction: function (req, res, next, cb) { cb(null, ['user']) }
    });
    var authCheck = roles.checkAuth(req, res, next);
    expect(nextCalled).to.not.be.ok();
    expect(sendCalled).to.be.ok()
  });

  it('should permit unauthenticated user if roles are null', function () {
    req = { method: 'GET', _parsedUrl: { pathname: '/open' } };
    var roles = new Roles({
      permissionsMapFile: __dirname +'/testconfig.json',
      authenticationFunction: function (req, res, next, cb) { cb(null, null) }
    });
    var authCheck = roles.checkAuth(req, res, next);
    expect(nextCalled).to.be.ok()
  });

  it('should permit authenticated user if roles are empty', function () {
    req = { method: 'GET', _parsedUrl: { pathname: '/needsauthentication' } };
    var roles = new Roles({
      permissionsMapFile: __dirname +'/testconfig.json',
      authenticationFunction: function (req, res, next, cb) { cb(null, []) }
    });
    var authCheck = roles.checkAuth(req, res, next);
    expect(nextCalled).to.be.ok()
  });

  it('should deny unauthenticated user', function () {
    req = { method: 'GET', _parsedUrl: { pathname: '/needsauthentication' } };
    var sendCalled = false;
    res = {
      status: function (status) {
        expect(status).to.be(401);
        return this;
      },
      send: function (message) {
        sendCalled = true;
        expect(message).to.be('Authentication required!');
      }
    };
    var roles = new Roles({
      permissionsMapFile: __dirname +'/testconfig.json',
      authenticationFunction: function (req, res, next, cb) { cb(null, null) }
    });
    var authCheck = roles.checkAuth(req, res, next);
    expect(nextCalled).to.not.be.ok()
    expect(sendCalled).to.be.ok()
  });
});