var pathToRegexp = require('path-to-regexp');

var Roles = function (config) {
  this.config = config;
  if (typeof this.config.authenticationFunction !== 'function') {
    throw new Error('No \'authenticationFunction\' parameter given or not a function!');
  }
  if (this.config.permissionsMapFile) {
    this.config.permissionsMap = require(this.config.permissionsMapFile);
  }
  if (!this.config.permissionsMap) {
    throw new Error('No \'permissionsMap\' or \'permissionsMapFile\' parameter given!');
  }
  if (!this.config.rolesProperty) {
    this.config.rolesProperty = 'roles';
  }

  var services = this.config.permissionsMap;
  var servicesRegExp = {}, keys, reg;
  for (var method in services) {
    if (!services.hasOwnProperty(method)) {
      continue;
    }
    for (var endpoint in services[method]) {
      if (!services[method].hasOwnProperty(endpoint)) {
        continue;
      }
      if (!servicesRegExp[method]) {
        servicesRegExp[method] = [];
      }

      keys = [];
      reg = pathToRegexp(endpoint, keys);
      servicesRegExp[method].push({ options: services[method][endpoint], reg: reg, path: endpoint });
    }
  }
  if (!servicesRegExp) {
    throw new Error('Invalid permissions mapping!');
  }
  this.servicesRegExp = servicesRegExp;
};

Roles.prototype.authenticationRequired = function (req, res, next) {
  res.status(401).send('Authentication required!');
};

Roles.prototype.permissionDenied = function (req, res, next) {
  res.status(403).send('Permission denied!');
};

function login(req, next, user) {
  req.login(user,  function (err) {
    if (err) {
      return next(err);
    }
    return next();
  });
}

Roles.prototype.checkAuth = function (req, res, next, context) {
  // OPTIONS can not have Authentication header
  if (req.method.toLowerCase() === 'options') {
    return next();
  }
  if (!context) {
    context = this;
  }
  var self = this;
  var servicesRegExp = context.servicesRegExp;
  var permittedRoles = [];

  if (servicesRegExp[req.method]) {
    for (var i = 0; servicesRegExp[req.method] && i < servicesRegExp[req.method].length; i++) {
      if (servicesRegExp[req.method][i].reg.test(req._parsedUrl.pathname)) {
        permittedRoles = servicesRegExp[req.method][i].options.roles;
        if (typeof permittedRoles === 'undefined' || permittedRoles === null) {
          permittedRoles = null;
        } else if (!Array.isArray(permittedRoles)) {
          throw new Error('"roles" is not an array!');
        }
        break;
      }
    }
  }

  if (Array.isArray(permittedRoles)) {
    context.config.authenticationFunction(req, res, next, function (err, user) {
      if (err) {
        throw new Error(err);
      }

      var roles = user[context.config.rolesProperty];

      if (!roles) {
        return self.authenticationRequired(req, res, next);
      }

      if (permittedRoles.length === 0) {
        return login(req, next, user);
      }

      for (var item in roles) {
        var role = roles[item];
        if (permittedRoles.indexOf(role) !== -1) {
          return login(req, next, user);
        }
      }
      return self.permissionDenied(req, res, next);
    });
  } else {
    next();
  }
};

Roles.prototype.middleware = function () {
  var self = this;
  return function (req, res, next) {
    self.checkAuth(req, res, next, self);
  }
};

module.exports = Roles;