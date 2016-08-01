var pathToRegexp = require('path-to-regexp');

function Roles(config) {
  this.config = config;
  if (typeof this.config.authenticationFunction !== 'function') {
    throw new Error('No authenticationFunction given or not a function!');
  }
  if (this.config.permissionsMapFile) {
    this.config.permissionsMap = require(this.config.permissionsMapFile);
  } else if (!this.config.permissionsMap) {
    throw new Error('No permissionsMap or permissionsMapFile given!');
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
  this.servicesRegExp = servicesRegExp;
}

Roles.prototype.permissionDenied = function (req, res, next) {
  res.status(403).send('Permission denied!');
};

Roles.prototype.checkAuth = function (req, res, next) {
  var self = this;
  var servicesRegExp = this.servicesRegExp;
  var permittedRoles = [];

  if (servicesRegExp[req.method]) {
    for (var i = 0; servicesRegExp[req.method] && i < servicesRegExp[req.method].length; i++) {
      if (servicesRegExp[req.method][i].options.roles && servicesRegExp[req.method][i].reg.test(req._parsedUrl.pathname)) {
        permittedRoles = servicesRegExp[req.method][i].options.roles;
        if (!Array.isArray(permittedRoles)) {
          throw new Error('"roles" is not an array!');
        }
        break;
      }
    }
  }

  if (permittedRoles.length > 0) {
    this.config.authenticationFunction(req, res, next, function (err, roles) {
      if (err) {
        throw new Error(err);
      }


      for (var item in roles) {
        var role = roles[item];
        if (permittedRoles.indexOf(role) !== -1) {
          return next();
        }
      }
      return self.permissionDenied(req, res, next);
    });
  } else {
    next();
  }
};

Roles.prototype.middleware = function () {
  return this.checkAuth;
};

module.exports = Roles;