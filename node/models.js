var crypto = require('crypto'),
    User,
    LoginToken;
var fs = require('fs');
    
function defineModels(mongoose, fn) {
  var Schema = mongoose.Schema,
      ObjectId = Schema.ObjectId;



/**
  * Model: User
  */
  function validatePresenceOf(value) {
    return value && value.length;
  }

  User = new Schema({
    'email': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'hashed_password': String,
    'salt': String
  });

  User.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  User.virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
    })
    .get(function() { return this._password; });

  User.method('authenticate', function(plaStringext) {
    return this.encryptPassword(plaStringext) === this.hashed_password;
  });
  
  User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  User.method('encryptPassword', function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
  });

  User.pre('save', function(next) {
    if (!validatePresenceOf(this.password)) {
      next(new Error('Invalid password'));
    } else {
      next();
    }
  });

/**
  * Model: LoginToken
  *
  * Used for session persistence.
  */
  LoginToken = new Schema({
    email: { type: String, index: true },
    series: { type: String, index: true },
    token: { type: String, index: true }
  });

  LoginToken.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  LoginToken.pre('save', function(next) {
    // Automatically create the tokens
    this.token = this.randomToken();

    if (this.isNew)
      this.series = this.randomToken();

    next();
  });

  LoginToken.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  LoginToken.virtual('cookieValue')
    .get(function() {
      return JSON.stringify({ email: this.email, token: this.token, series: this.series });
    });

  
  /**
  * Model: Category
  */
  var Category = new Schema({
    'name': { type: String, unique: true },
    'icon': String,
    'on_index': Boolean,
    'index_order': Number
  });
  
  /**
  * Model: Problem
  */
  var Problem = new Schema({
    'name': { type: String, unique: true },
    'description': String,
    'categories': [ String ], 
    'solutions': [ String ]
  });
  
    
  /**
  * Model: Solution
  */
  var Solution = new Schema({
    'name': { type: String, unique: true },
    'filename': String,
    'statistics': {
      'started': Number,
      'finished_successful': Number,
      'finished_failed': Number,
      'finished_good_solution': Number,
      'finished_bad_solution': Number
    }
  });
  
  Solution.pre('save', function(next) {
    try {
      stats = fs.lstatSync('data/solutions/' + this.filename);
    }
    catch (e) {
      console.log("Failed save solution statistics for " + this.filename + ": " + e);
      next(new Error('Solution doesn\'t exist'));
    }
    if ( this.statistics == undefined ||
      this.statistics.started == undefined ||
      this.statistics.finished_successful == undefined ||
      this.statistics.finished_failed == undefined ||
      this.statistics.finished_good_solution == undefined ||
      this.statistics.finished_bad_solution == undefined
    ) {
      this.statistics = {
        'started': 0,
        'finished_successful': 0,
        'finished_failed': 0,
        'finished_good_solution': 0,
        'finished_bad_solution': 0
      };
    }
    next();
  });

/**
  * Model: Organizations
  */
  
  var Organizations = new Schema({
    'organization_name': { type: String, index: true },
    'regions_list': [ {
      'region_name': String,
      'organizations_list': [ {
        'title': String,
        'short_description': String,
        'description': {
          'text': String,
          'web': String,
          'phone': [ {
            'phone_who': String,
            'phone': String
          } ],
          'postal_address': String,
          'electronic_address': {
            'email': [ {
              'email_who': String,
              'email': String
            } ] ,
            'webform': String
          }
        }
      } ]
    } ]
  });
  

/**
 * Model: Texts
 */

  var Texts = new Schema({
    'text_name': { type: String, index: true },
    'title': String,
    'short_description': String,
    'text': String
  });
  

  mongoose.model('User', User);
  mongoose.model('LoginToken', LoginToken);
  mongoose.model('Category', Category);
  mongoose.model('Problem', Problem);
  mongoose.model('Solution', Solution);
  mongoose.model('Organizations', Organizations);  
  mongoose.model('Texts', Texts);

  fn();
}

exports.defineModels = defineModels; 
