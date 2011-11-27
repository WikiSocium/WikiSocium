/*
	Functions
 */

function Render404(res, err)
{
	res.render('404', {
				   'title':'404',
				   'err': err,
				   'scripts':[]
			   });
}

/**
 * Module dependencies.
 */

var express = require('express');
var connect = require('connect');
var jade = require('jade');
var fs = require('fs');
var jQ = require('jquery');
var mongoose = require('mongoose');
var mongoStore = require('connect-mongodb');
var models = require('./models')
    ,db
    ,User
    ,LoginToken
//    ,Settings = { development: {}, test: {}, production: {} }
//    ,emails
    ;

var app = module.exports = express.createServer();

// Configuration
// [RESEARCH] Не имею ни малейшего понятия что происходит в этом конфигурировании,
// если кто-нибудь разберется и расскажет — будет круто.

// загрузка helpers -- штука, которая выводит сообщения или ошибки
app.helpers(require('./helpers.js').helpers);
app.dynamicHelpers(require('./helpers.js').dynamicHelpers);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser()); 
  app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  app.set('db-uri', 'mongodb://localhost/wikisocium-development');
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
  app.set('db-uri', 'mongodb://localhost/wikisocium-production');
});

var db = mongoose.connect(app.set('db-uri'));


models.defineModels(mongoose, function() {
  //app.Document = Document = mongoose.model('Document');
  app.User = User = mongoose.model('User');
  app.LoginToken = LoginToken = mongoose.model('LoginToken');
  db = mongoose.connect(app.set('db-uri'));
})

app.dynamicHelpers({
  session: function (req, res) {
  return req.session;
  },
   res: function(req, res){
   return res;
   }
   
});

// Routes

//app.get('/templates/:caseName/', function(req, res){
//		var caseName = req.param('caseName', null);
//		res.render('caseOverview', {
//				   title: "overview of selected case",
//				   selectedCase: allTemplates[caseName],
//				   scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
//							 '/javascripts/Curry-1.0.1.js',
//							 '/javascripts/raphael-min.js',
//							 '/javascripts/dracula_algorithms.js',
//							 '/javascripts/dracula_graffle.js',
//							 '/javascripts/dracula_graph.js',
//							 '/javascripts/seedrandom.js']
//				   });
//});

// [FYI]
// req <=> request
// res <=> response



function authenticateFromLoginToken(req, res, next) {
  var cookie = JSON.parse(req.cookies.logintoken);

  LoginToken.findOne({ email: cookie.email,
                       series: cookie.series,
                       token: cookie.token }, (function(err, token) {
    if (!token) {
      res.redirect('/sessions/new');
      return;
    }

    User.findOne({ email: token.email }, function(err, user) {
      if (user) {
        req.session.user_id = user.id;
        req.currentUser = user;

        token.token = token.randomToken();
        token.save(function() {
          res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          next();
        });
      } else {
        res.redirect('/sessions/new');
      }
    });
  }));
}

function loadUser(req, res, next) {
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        req.currentUser = user;
        req.currentUser.guest = 0;
        next();
      } else {
        req.currentUser = {}
        req.currentUser.guest = 1;
        next();
      }
    });
  } else if (req.cookies.logintoken) {
    authenticateFromLoginToken(req, res, next);
  } else {
    req.currentUser = {}
    req.currentUser.guest = 1;
    next();
  }
}

//
// Обработка корня
app.get('/', loadUser, function(req, res) {
        res.render('index', {
                'title':"Usage",
                'user':req.currentUser, 
                scripts:[]});
        });

//
// Обработка запроса на показ списка проблем
app.get('/Problems', function(req, res){
		fs.readFile('data/problems/problems.json', "utf-8", function(err, data){
						if(!err)
						{
							var problemsList = jQ.parseJSON(data);
							res.render('problems', {
									   'title' : "Problems list",
									   'problemsList' : problemsList.problemsList,
									   'scripts' : ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
									   });
						}
						else
							Render404(res, err);
					});
		});

//
// Обработка запроса на показ проблемы и списка ее решений
app.get('/Problems/:ProblemName', function(req, res){
		var problemName = req.param('ProblemName', null);
		
		fs.readFile('data/problems/'+ problemName +'.json', "utf-8", function(err, data){
					if(!err)
					{
						var problem = jQ.parseJSON(data);
						res.render('problem', {
									   'title' : problemName,
									   'problem' : problem,
									   'scripts' : ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
						   });
					}
					else
						Render404(res, err);
				});
		});

//
// Обработка запроса на показ конкретного кейса конкретного пользователя
app.get('/UserData/:UserName/:CaseId', function(req, res) {
    var userName = req.param('UserName', null);
    var caseId = req.param('CaseId', null);
    var caseData = "null";
    fs.readFile('data/' + userName + '/' + caseId + 'Data.txt', "utf-8", function(err, data) {
        if (err) {
	    fs.open('data/' + userName + '/' + caseId + 'Data.txt', 'w');
        }
        else {
            caseData = jQ.parseJSON(data);
        }
    });

    fs.readFile('data/'+userName+'/'+caseId+'.json', "utf-8", function(err, data) {
        if(!err) {
               
             var requestedCase = jQ.parseJSON(data);
                
             res.render('userCase', 
                        {
                            'title': userName + " : " + caseId,
                            'requestedCase' : requestedCase,
                            'caseData' : caseData,
                            'scripts' : [
                                'http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
                                'http://yui.yahooapis.com/3.4.0/build/yui/yui.js',
                                '/inputex/src/loader.js',
                                '/javascripts/controllers/' + requestedCase.id + '.js',
                                '/javascripts/jquery.json-2.3.min.js',
                                '/javascripts/StepsController.js']
                        });
             }
             else
                 Render404(res, err);
            });
    });
//        
//Сохранение данных кейса        
app.post('/UserData/:UserName/:CaseId/submitForm', function(req, res) {
    var userName = req.param('UserName', null);
    var caseId = req.param('CaseId', null);
    console.log(req.body.jsonData);
    fs.writeFile('data/' + userName + '/' + caseId + 'Data.txt', req.body.jsonData, function (err) {
          if (err) console.log(err);
    });
    res.send(req.body);
});

//
// Обработка запроса на показ информации о пользователе и списка всех его кейсов
app.get('/UserData/:UserName', function(req, res){
			var userName = req.param('UserName', null);
			
			fs.readFile('data/'+userName+'/user.json', "utf-8", function(err, data){
				if(!err)
				{
					var requestedUser = jQ.parseJSON(data);
						res.render('user', {
								'title': userName,
								'requestedUser': requestedUser,
								'scripts': ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
						   });
				}
				else
					Render404(res, err);				  
			});
		});

// Users
app.get('/users/new', function(req, res) {
  res.render('users/new.jade', {
    locals: { user: new User() },
    title: '',
    scripts: []
  });
});

app.post('/users.:format?', function(req, res) {
  var user = new User(req.body.user);

  function userSaveFailed() {
    req.flash('error', 'Не удалось создать аккаунт');
    res.render('users/new.jade', {
      locals: { user: user },
      title: '',
      scripts: []
    });
  }
  
  function userCreateEnv( user ) {
    fs.mkdir('data/'+user.email);
    
    var userJSON = {
      id: user.email,
      fullName: '',
      cases: ''
    };    
    var filter = new Array( 'id', 'fullName', 'cases' );
    
    fs.writeFile(
      'data/' + user.email + '/user.json',
      JSON.stringify (userJSON, filter, "\t"), encoding='utf8',
      function (err) {
        if (err) throw err;
        //console.log('It\'s saved!');
      }
    );
  }

  user.save(function(err) {
    if (err) return userSaveFailed();
    
    // creating user environment
    userCreateEnv(user);    
    
    req.flash('info', 'Ваш аккаунт был успешно создан');
    //emails.sendWelcome(user);

    switch (req.params.format) {
      case 'json':
        res.send(user.toObject());
      break;

      default:
        req.session.user_id = user.id;
        res.redirect('/');
    }
  });
});



// Sessions
app.get('/sessions/new', function(req, res) {
  res.render('sessions/new.jade', {
    locals: { user: new User() },
    title: '',
    scripts: []
  });
});

app.post('/sessions', function(req, res) {
  User.findOne({ email: req.body.user.email }, function(err, user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;

      req.flash('info', 'Вы вошли в систему. Здравствуйте!');

      // Remember me
      if (req.body.remember_me) {
        var loginToken = new LoginToken({ email: user.email });
        loginToken.save(function() {
          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          res.redirect('/');
        });
      } else {
        res.redirect('/');
      }      
    } else {
      req.flash('error', 'E-mail и пароль не подходят');
      res.redirect('/sessions/new');
    }
  }); 
});

app.get('/login', loadUser, function(req, res) {
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new');
  else res.redirect('/');
});

app.get('/logout', loadUser, function(req, res) {
  if (req.session) {
    LoginToken.remove({ email: req.currentUser.email }, function() {});
    res.clearCookie('logintoken');
    req.session.destroy(function() {});
  }
  res.redirect('/');
});




app.listen(3000);
console.log('Express server listening on port %d, environment: %s', app.address().port, app.settings.env)
console.log('Using connect %s, Express %s, Jade %s', connect.version, express.version, jade.version);

