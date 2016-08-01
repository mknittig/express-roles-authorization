# express-roles-authorization

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][download-url]

[Express](http://expressjs.com/) middleware for simple authorization with multiple roles via Express-style routes.

## Installation

    $ npm install express-roles-authorization

## Usage

#### Configure middleware

The authorization middleware needs to parameters to work.
A permission mapping and an authentication function.
Example with Express and [Passport](http://passportjs.org/):

    var roles = new Roles({
      permissionsMapFile: 'permissions.json',
      authenticationFunction: function (req, res, next, callback) {
        passport.authenticate('local', function (err, user) {
          return callback(err, user.roles);
        })(req, res, next);
      }
    });

    app.use(roles.middleware());

#### Permission Map

The `Roles` class needs a `config` parameter with contains the permissions mapping.
Either via a JSON file with `permissionsMapFile` or directly as a Javascript object with `permissionsMap`.

The mapping is structured as a hash object with the HTTP verbs on top-level. Under the HTTP verb Express-style routes
can be defined with contains a `roles` parameter with the permitted roles. If this is empty or unspecified anyone can
access the defined route. E.g.:

    {
      "GET": {
        "/helloworld": {
          "roles": ["user", "admin"]
        }
      },
      "POST": {
        "/helloworld": {
          "roles": ["admin"]
        }
      }
    }

#### API

##### Constructor

    new Roles(options);

Arguments:
* `config` (Object):
    * `permissionsMapFile` (String): Path to the json file with the permission mapping.
    * `permissionsMap` (Object, alternative to permissionsMapFile): Javascript object with the permission mapping.
    * `authenticationFunction` (Function): Callback to be called for authentication handling. Handle authentication errors.
        * `req` (express.Request): *express* Request object.
        * `res` (express.Response): *express* Response object.
        * `next` (express.Next): *express* Next object.
        * `callback` (Function): Returns a callback with the roles of the user. Signature: `callback(err, roles) => void`.
            * `err` (Error): return an Error if if an error occurred, otherwise yield `null` here.
            * `roles` (Array): returns an array with all roles of the authenticated user. Empty, null or undefined for unauthenticated user .


## Contributing

Clone the repo, then
```
npm install
```
and here we go.
Develop your new features or fixes, test it using `npm test` and create a pull request.

## Credits

  - [Markus Knittig](https://github.com/mknittig)

[npm-url]: https://npmjs.org/package/express-roles-authorization
[download-url]: https://npmjs.org/package/express-roles-authorization
[npm-image]: https://img.shields.io/npm/v/express-roles-authorization.svg?style=flat
[downloads-image]: https://img.shields.io/npm/dm/express-roles-authorization.svg?style=flat