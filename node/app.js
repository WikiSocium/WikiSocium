/*
	Functions
 */

function Render404(req,res, err)
{
	res.render('404', {
				   'title':'404',
				   user: req.currentUser,
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
var async = require('async');
var models = require('./models')
    ,db
    ,User
    ,LoginToken
    ,SolutionStatistics
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
  app.SolutionStatistics = SolutionStatistics = mongoose.model('SolutionStatistics');
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

function userCreateEnv( user ) {
  fs.mkdir('data/UserData/'+user.email);
  
  var userJSON = {
    id: user.email,
    fullName: '',
    cases: []
  };    
  var filter = new Array( 'id', 'fullName', 'cases' );
  
  fs.writeFile(
    'data/UserData/' + user.email + '/user.json',
    JSON.stringify (userJSON, filter, "\t"), encoding='utf8',
    function (err) {
      if (err) throw err;
    }
  );
  console.log ('Creating user folder and user.json for ', user.email);
}

function increaseSolutionStatistics ( solution_name, field_name ) {
  SolutionStatistics.findOne ({ solution_name: solution_name }, function(e, solution) {
    if (!solution) {
      var solution = new SolutionStatistics({
        solution_name:solution_name,
        started: 0,
        finished_successful: 0,
	      finished_failed: 0,
	      finished_good_solution: 0,
        finished_bad_solution: 0
      });
    }
    solution[field_name]++;
    solution.save(function(err) {
      console.log(err);
    });
  }); 
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
app.get('/Problems', loadUser, function(req, res){
		fs.readFile('data/problems/problems.json', "utf-8", function(err, data){
						if(!err)
						{
							var problemsList = jQ.parseJSON(data);
							res.render('problems', {
									   'title' : "Problems list",
									   'user':req.currentUser,
									   'problemsList' : problemsList.problemsList,
									   'scripts' : ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
									   });
						}
						else
							Render404(req,res, err);
					});
		});

//
// Обработка запроса на показ проблемы и списка ее решений
app.get('/Problems/:ProblemName', loadUser, function(req, res){
		var problemName = req.param('ProblemName', null);
		
		fs.readFile('data/problems/'+ problemName +'.json', "utf-8", function(err, data){
					if(!err)
					{
						var problem = jQ.parseJSON(data);
						res.render('problem', {
									   'title' : problemName,
                     	               'user':req.currentUser, 
									   'problem' : problem,
									   'scripts' : ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
						   });
					}
					else
						Render404(req,res, err);
				});
		});

//
app.get ('/addcase/:SolutionName', loadUser,function(req,res) {
  
    if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
    else
        { 
          var SolutionNew = req.param('SolutionName', null);
 	      	res.render('AddCaseForUser', {
                                        locals: {Solution: SolutionNew},
                                        user: req.currentUser, 
			                            title: '',
			                            scripts: []
			                                  }
                    );
      }
	});


// Обработка запроса на показ конкретного кейса конкретного пользователя
app.get('/UserData/:UserName/:CaseId/', loadUser , function(req, res) {

    var userName = req.param('UserName', null);
    var caseId = req.param('CaseId', null);

    res.redirect("/UserData/" + userName + "/" + caseId);
});

app.get('/UserData/:UserName/:CaseId', loadUser, function(req, res) {
  var userName = req.param('UserName', null);
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else 
  {
    if (req.currentUser.email != userName) 
    {
      res.redirect('/');
      req.flash('info', 'Не смотрите чужие документы');
    }
    else 
    {
      var caseId = req.param('CaseId', null);
      fs.readFile('data/UserData/'+userName+'/'+caseId+'.json', "utf-8", function(err, data) {
        if(!err) 
        {
          var requestedCase = jQ.parseJSON(data);
          var stylesToInject = [];
          var scriptsToInject =      [
				        'http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
				        'http://yui.yahooapis.com/3.4.0/build/yui/yui.js',
                      'http://api-maps.yandex.ru/1.1/index.xml?key=AEj3nE4BAAAAlWMwGwMAbLopO3UdRU2ufqldes10xobv1BIAAAAAAAAAAADoRl8HuzKNLQlyCNYX1_AY_DTomw==',
				        '/inputex/src/loader.js',
				        '/javascripts/controllers/' + requestedCase.id + '.js',
				        '/javascripts/jquery.json-2.3.min.js',
				        '/javascripts/CaseDataController.js',
				        '/javascripts/StepsController.js',
				        '/javascripts/runtime.min.js',
				        '/javascripts/ww.jquery.js'];
				        
				// Для каждого документа, который нужен кейсу, вставляем скрипт с генерацией этого документа
				  var requiredDocuments = requestedCase.data.documents;
          if(requiredDocuments)
          {
            for(var i = 0; i < requiredDocuments.length; i++)
                scriptsToInject.push("/documents/" + requiredDocuments[i] + ".js");
            scriptsToInject.push("/javascripts/jquery.markitup.js");
            scriptsToInject.push("/markitup/sets/default/set.js");            
            stylesToInject.push("/markitup/sets/default/style.css");
            stylesToInject.push("/markitup/skins/markitup/style.css");            
          }
            
          fs.readFile('data/UserData/' + userName + '/' + caseId + 'Data.txt', "utf-8", function(err, data) {
            if (err)
            {
              fs.open('data/UserData/' + userName + '/' + caseId + 'Data.txt', 'w');
              err = false;
            }
            var caseData = jQ.parseJSON(data);
            
            res.render('userCase', 
            {
              'title': userName + " : " + caseId,
              'user':req.currentUser, 
              'requestedCase' : requestedCase,
              'caseData' : caseData,
              'scripts' : scriptsToInject,
              'styles' : stylesToInject
            });
          });
        }
        else Render404(req,res, err);
      });
    }
  }
});
//        
//Сохранение данных кейса        
app.post('/UserData/:UserName/:CaseId/submitForm', function(req, res) {
    var userName = req.param('UserName', null);
    var caseId = req.param('CaseId', null);
    console.log(req.body.jsonData);
    fs.writeFile('data/UserData/' + userName + '/' + caseId + 'Data.txt', req.body.jsonData, function (err) {
          if (err) console.log(err);
    });
    res.send(req.body);
});

//
//Завершение кейса
app.post('/UserData/:UserName/:CaseId/endCase', loadUser, function(req, res) {
    var userName = req.param('UserName', null);
    var caseId = req.param('CaseId', null);
    
    // [TODO]
    // 0. Проверить, что пользователь аутентифицирован
    if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
    else {
      if (req.currentUser.email != userName) res.redirect('/sessions/new');
      else {
    
        // 1. Изменить статус кейса
        fs.readFile('data/' + userName + '/' + caseId + '.json', "utf-8", function(err, data){
		    if(!err)
		    {
			    var userCase = jQ.parseJSON(data);
			    userCase.status = 1;
			    fs.writeFile('data/' + userName + '/' + caseId + '.json', JSON.stringify(userCase), encoding='utf8', function (err) {
                  if (err) throw err;
                });
		    }});
		
        // 2. Записать статистику
        // тут Solution -> solution_name. Сейчас брать неоткуда(
        /*
        if ( req.body.isSolved == 'yes' ) {
          increaseSolutionStatistics ( Solution, 'finished_successful' );
          if ( req.body.isSolutionUsed == 'yes' ) increaseSolutionStatistics ( Solution, 'finished_good_solution' );
          else increaseSolutionStatistics ( Solution, 'finished_bad_solution' );
        }
        else {
          increaseSolutionStatistics ( Solution, 'finished_successful' );
          if ( req.body.isSolutionCorrect == 'yes' ) increaseSolutionStatistics ( Solution, 'finished_good_solution' );
          else increaseSolutionStatistics ( Solution, 'finished_bad_solution' ); 
        }*/
        
        // 3. Отправить на главную страницу
        res.redirect('/');
        }
    }
});

app.get('/UserData/:UserName/:CaseId/endCase', function(req, res) {
  res.redirect('/UserData/'+req.param('UserName')+'/'+req.param('CaseId'));
});

//
// Обработка запроса на показ информации о пользователе и списка всех его кейсов
app.get('/UserData/:UserName', loadUser, function(req, res){
			var userName = req.param('UserName', null);

  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else{
  if(req.currentUser.email!=userName) {res.redirect('/');req.flash('info', 'Не смотрите чужие документы');}
    else{
			fs.readFile('data/UserData/'+userName+'/user.json', "utf-8", function(err, data){
				if(!err)
				{
					var requestedUser = jQ.parseJSON(data);
						res.render('user', {
								'title': userName,
                                'user':req.currentUser, 
								'requestedUser': requestedUser,
								'scripts': ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
						   });
				}
				else
					Render404(req,res, err);				  
			});
    }
}
});

function parseReturnTo ( req_query_return_to ) {
  if (req_query_return_to == undefined) return '/';
  else return req_query_return_to;
}

// Users
app.get('/users/new', loadUser, function(req, res) {
  res.render('users/new.jade', {
    locals: { return_to: parseReturnTo(req.query.return_to) },
    user:req.currentUser, 
    title: '',
    scripts: []
  });
});

app.post('/addcasetouser/:SolutionName', loadUser, function(req, res) {
  
  var Solution = req.param('SolutionName', null);
  //solution -> case
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
	 	fs.readFile('data/solutions/' + Solution + '.json', "utf-8", function(err, data){
		  if (!err) {
			  var problem = jQ.parseJSON(data);
			  problem.id = req.body.case_id;
        filter = new Array( 'id', 'name', 'description','data','currentStep','steps' );
        fs.writeFile(
          'data/UserData/' + req.currentUser.email +'/' + problem.id + '.json',
          JSON.stringify (problem,space = '\t'), encoding='utf8',
          function (err) {
            if (err) throw err;
          });
		  }
			else Render404(req,res, err);
    });
    //Добавляем кейс в спиок кейсов юзера
    fs.readFile('data/UserData/' + req.currentUser.email + '/user.json', "utf-8", function(err, data){
      if (!err) {
        var userJSON = jQ.parseJSON(data);
        userJSON.cases.push (req.body.case_id);
        
        var filter = new Array( 'id', 'fullName', 'cases' );
        
        fs.writeFile(
          'data/UserData/' + req.currentUser.email + '/user.json',
          JSON.stringify (userJSON, filter, "\t"), encoding='utf8',
          function (err) {
            if (err) throw err;
        });
      }
      else Render404(req,res, err);
    });
    increaseSolutionStatistics ( Solution, 'started' );
    res.redirect('/');
	}; 
});



app.post('/users.:format?', loadUser, function(req, res) {
  var user = new User(req.body.user);

  function userSaveFailed() {
    req.flash('error', 'Не удалось создать аккаунт');
    res.render('users/new.jade', {
      locals: { return_to: parseReturnTo(req.query.return_to) },
      user:req.currentUser, 
      title: '',
      scripts: []
    });
  }

  user.save(function(err) {
    if (err) return userSaveFailed();
    
    // creating user environment
    userCreateEnv(user);    
    
    req.flash('info', 'Ваш аккаунт был успешно создан');
    //emails.sendWelcome(user);
    
    var return_to = parseReturnTo(req.query.return_to);

    switch (req.params.format) {
      case 'json':
        res.send(user.toObject());
      break;

      default:
        req.session.user_id = user.id;
        res.redirect(return_to);
    }
  });
});



// Sessions
app.get('/sessions/new', loadUser, function(req, res) {

  res.render('sessions/new.jade', {
    user:req.currentUser,
    locals: { return_to: parseReturnTo(req.query.return_to) },
    title: '',
    scripts: []
  });
});

app.post('/sessions', function(req, res) {

  var return_to = parseReturnTo(req.query.return_to);

  User.findOne({ email: req.body.user.email }, function(err, user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;
          
      try
      {
        stats = fs.lstatSync('data/UserData/'+user.email);
        
        if ( !stats.isDirectory() ) {       
          fs.unlink('data/UserData/'+user.email, function (err) {
            if (err) throw err;
            console.log('Deleting file '+'data/UserData/'+user.email);
          });
          userCreateEnv(user);
        }        
      }
      catch (e)
      {
          console.log(user.email + ": " + e);
          userCreateEnv(user);
      }
      
      req.flash('info', 'Вы вошли в систему. Здравствуйте!');

      // Remember me
      if (req.body.remember_me) {
        var loginToken = new LoginToken({ email: user.email });
        loginToken.save(function() {
          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          res.redirect(return_to);
        });
      } else {
        res.redirect(return_to);
      }      
    } else {
      req.flash('error', 'E-mail и пароль не подходят');
      res.redirect('/sessions/new?return_to='+return_to);
    }
  }); 
});

app.get('/login', loadUser, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
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

// Statistics

app.get('/statistics/solutions', loadUser, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {   
    fs.readdir("data/solutions", function (err, files) {
      if (err) throw err;
      
      var solutions = new Array();
      var solution_name;
      for (var key in files) {
        solution_name = files[key].replace(/.json/g,"");
        solutions[key] = new Object();
        solutions[key].name = solution_name;
        //solutions[key].statistics = {};
      }

      var f = function(arg, callback) {
        SolutionStatistics.findOne ({ solution_name: arg.name }, function(e, solution) {
          var stats_obj = new Object();
          if (solution) {
            arg.statistics = solution;
          }
          else {
            arg.statistics = {
              started: 0,
              finished_successful: 0,
	            finished_failed: 0,
	            finished_good_solution: 0,
          	  finished_bad_solution: 0
            }
          }
          callback();
        }); 
      }
      async.forEach(solutions, f, function(err) {
        res.render('statistics/solutions.jade', {
          title: "Статистики по решениям",
          user:req.currentUser,
          solutions: solutions, 
          scripts:[]
        })
      });
    });
  }
});
///
/// Compiling documents templates to client-side javascript
///
console.log("Compiling documents templates...");
var documents = fs.readdirSync('public/documents/');
for(var i = 0; i < documents.length; i++)
{
    var lines = documents[i].split('.');
    if(lines.length == 2 && lines[1] == 'jade')
    {
        try
        {
            var file = fs.readFileSync('public/documents/' + documents[i], 'utf8');
            var fn = jade.compile(file, { client: true, pretty: true });
            // Well, this is a fragile place. We utilize an info, that CollectFormData and #documentViewDOCNAME exist
            var doc_code = "function GenerateDocument_" + lines[0] +
                           "(){$('#documentView_" + lines[0] +
                           "').html((" + fn + ")({'data':CollectFormData()}));}"
            fs.writeFileSync('public/documents/' + lines[0] + '.js', doc_code);
        }
        catch(err)
        {
            console.log("[ERROR]: " + documents[i] + " is not a valid .jade template");
        }
    }
    else if(lines.length != 2 || (lines.length == 2 && lines[1] != 'js'))
    {
        // Some error checking
        console.log("[ERROR]: " + documents[i] + " is not a valid .jade template");
    }
}
console.log("All documents compiled");

///
/// Launching server
///
app.listen(3000);
console.log('Express server listening on port %d, environment: %s', app.address().port, app.settings.env)
console.log('Using connect %s, Express %s, Jade %s', connect.version, express.version, jade.version);

