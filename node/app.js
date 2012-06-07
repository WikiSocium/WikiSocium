/*
	Functions
 */

function Render404(req,res, err)
{
	res.render('404', {
    'title':'404',
    'user': req.currentUser,
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
var mongoose = require('mongoose');
var mongoStore = require('connect-mongodb');
var async = require('async');
var models = require('./models')
    ,db
    ,User
    ,LoginToken
    ,SolutionStatistics
    ,Organizations
    ,Texts
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
  app.Organizations = Organizations = mongoose.model('Organizations');  
  app.Texts = Texts = mongoose.model('Texts');
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
//				   scripts: ['/javascripts/Curry-1.0.1.js',
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
      req.currentUser = {}
      req.currentUser.guest = 1;
      next();
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
        req.currentUser = {}
        req.currentUser.guest = 1;
        next();
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

function generateMenu(req, res, next) {
  var menu = [
    {
      'id': 'About',
      'name': 'О проекте',
      'guest': true
    },
    {
      'id': 'Problems',
      'name': 'Проблемы и решения',
      'guest': true
    },
    {
      'id': 'MyCases',
      'name': 'Мои дела',
      'guest': false
    }
  ];
  res.menu = [];
  for (var i in menu) {
    if (menu[i].guest || !menu[i].guest && !req.currentUser.guest) {
      var is_active = false;
      if (req.url.indexOf(menu[i].id) == 1) is_active = true;
      res.menu.push({
        'id': menu[i].id,
        'name': menu[i].name,
        'active': is_active
      });
    }
  }
  next();
}

function userCreateEnv( user_id ) {
  fs.mkdir('data/UserData/'+user_id);
  fs.mkdir('data/UserData/'+user_id+'/cases');
  
  var userJSON = {
    id: user_id,
    fullName: '',
    cases: []
  };  
  fs.writeFile('data/UserData/' + user_id + '/user.json', JSON.stringify (userJSON, null, "\t"), encoding='utf8',
    function (err) {
      if (err) throw err;
    }
  );
  console.log ('Creating user folder and user.json for ', user_id);
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
      if (err != null) console.log(err);
    });
  }); 
}

//
// Обработка корня
app.get('/', loadUser, generateMenu, function(req, res) {
  fs.readFile('data/categories/categories.json', "utf-8", function(err, data){
    if(!err) {
      var categoryList = JSON.parse(data);
      res.render('index', {
        'title':"ВикиСоциум development",
        'user':req.currentUser,
        'menu':res.menu,
        'categoryList' : categoryList.categoryList,
        'scripts':[],
        'styles':[]
      });
    }
    else Render404(req,res, err);
  });
});


//
// Обработка запроса на показ списка проблем
app.get('/Problems', loadUser, generateMenu, function(req, res){
  fs.readFile('data/problems/problems.json', "utf-8", function(err, data){
	if(!err) {
    var problemsList = JSON.parse(data);              
		res.render('problems', {
		  'title' : "Problems list",
      'user':req.currentUser,
      'menu':res.menu,
			'problemsList' : problemsList.problemsList,
			'scripts' : [],
      'styles': []
	  });
	}
	else
		Render404(req,res, err);
	});
});

// Обработка запроса на показ проблемы и списка ее решений
app.get('/Problems/:ProblemName', loadUser, generateMenu, function(req, res){
	var problemName = req.param('ProblemName', null);
		
	fs.readFile('data/problems/'+ problemName +'.json', "utf-8", function(err, data){
    if(!err) {
			var problem = JSON.parse(data);
			res.render('problem', {
        'title' : problemName,
        'user':req.currentUser,
        'menu':res.menu,
				'problem' : problem,
				'scripts' : ['/javascripts/modal_window.js'],
        'styles'  : ['http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css']
			 });
		}
		else Render404(req,res, err);
	});
});

//

// Обработка запроса на показ списка проблем из категории
app.get('/Categories/:CategoryName', loadUser, generateMenu, function(req, res){
	var categoryName = req.param('CategoryName', null);
	
	fs.readFile('data/problems/problems.json', "utf-8", function(err, data){
		if(!err) {
			var problemsList = JSON.parse(data);

			//Здесь я сделаю массив с нужным из problemsList
							
			var categoryList = [];
			var i;
			for(i = 0; i < problemsList.problemsList.length; i++) {
				var j;
			  for (j = 0; j < problemsList.problemsList[i].Categories.length; j++) {
          if (categoryName == problemsList.problemsList[i].Categories[j]) {
					  categoryList.push(problemsList.problemsList[i])
						break;
					}
				}
			}
			
			res.render('problems', {
			  'title' : categoryName,
			  'user':req.currentUser,
        'menu':res.menu,
			  'problemsList' : categoryList,
			  'scripts' : [],
        'styles':[]
			});
		}
		else Render404(req,res, err);
	});
});

app.get ('/addcase/:SolutionName', loadUser, generateMenu,function(req,res) {
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else { 
    var SolutionNew = req.param('SolutionName', null);
 	  res.render('AddCaseForUser', {
      locals: {Solution: SolutionNew},
      'user': req.currentUser,
      'menu':res.menu,
      title: '',
      scripts: [],
      styles:[]
		});
  }
});


// Обработка запроса на показ конкретного кейса конкретного пользователя
app.get('/MyCases/:CaseId', loadUser, generateMenu, function(req, res) {
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else 
  {    
    var userName = req.currentUser.email;
    var caseId = req.param('CaseId', null);
    fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data){
      if (!err) {
        var userJSON = JSON.parse(data);
        solutionId = false;
        for (var key in userJSON.cases) {
            if (userJSON.cases[key].caseId == caseId) {
              solutionId = userJSON.cases[key].solutionId;
              break;
            }
        }
        if (solutionId)
          fs.readFile('data/solutions/'+solutionId+'.json', "utf-8", function(err, data) {
            if(!err) 
            {
              var solutionData = JSON.parse(data);
              var stylesToInject = [];
              var scriptsToInject = [
                'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js',
                'http://jquery-ui.googlecode.com/svn/trunk/ui/i18n/jquery.ui.datepicker-ru.js',
                'http://yui.yahooapis.com/3.4.0/build/yui/yui.js',
                'http://api-maps.yandex.ru/1.1/index.xml?key=AEj3nE4BAAAAlWMwGwMAbLopO3UdRU2ufqldes10xobv1BIAAAAAAAAAAADoRl8HuzKNLQlyCNYX1_AY_DTomw==',
                '/inputex/src/loader.js',
                '/javascripts/jquery.json-2.3.min.js',
                '/javascripts/CaseDataController.js',
                '/javascripts/StepsController.js',
                '/javascripts/customWidgets/timer.js',
                '/javascripts/runtime.min.js',
                '/javascripts/jquery.watch-2.0.min.js',
                '/javascripts/jquery.prettyPhoto.js',
                '/javascripts/modal_window.js',
                '/javascripts/RegionalizedData.js'
              ];
              
              // Для каждого документа, который нужен кейсу, вставляем скрипт с генерацией этого документа
              var requiredDocuments = solutionData.data.documents;
              if(requiredDocuments)
              {
                for(var i = 0; i < requiredDocuments.length; i++) scriptsToInject.push("/documents/" + requiredDocuments[i] + ".js");
                if(requiredDocuments.length != 0) scriptsToInject.push("/documents/DocumentsController.js");
                scriptsToInject.push("/javascripts/nicEdit.js");
                scriptsToInject.push("/markitup/sets/default/set.js");            
                stylesToInject.push("/markitup/sets/default/style.css");
                stylesToInject.push("http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css");
                stylesToInject.push("/markitup/skins/simple/style.css");            
                stylesToInject.push("/stylesheets/prettyPhoto.css");
              }
              fs.readFile('data/UserData/' + userName + '/cases/' + caseId + '.json', "utf-8", function(err, caseContentsJson) {
                if (err) {
                  var caseContents = {};
                  err = false;
                }
                else {
                  var caseContents = JSON.parse(caseContentsJson);
                  if (caseContents == null) var caseContents = {};
                }

                res.render('userCase', 
                {
                  'title': userName + " : " + caseId,
                  'user':req.currentUser,
                  'menu':res.menu, 
                  'solutionData' : solutionData,
                  'caseData' : caseContents.data,
                  'caseName' : caseContents.name,
                  'currentStep' : caseContents.currentStep,
                  'stepsHistory' : caseContents.steps,
                  'scripts' : scriptsToInject,
                  'styles' : stylesToInject
                });
              });
            }
            else Render404(req,res, err);
          });
        else Render404(req,res,'У вас нет дела с этим id')
      }
      else Render404(req,res, err);
    });
  }
});

//Запрос списка регионов
app.post('/GetRegions', function(req, res) {
    var regions_list = fs.readFileSync('data/regions.json', "utf-8");
    res.send(JSON.parse(regions_list));
});

//
// Механизм запросов регионализируеммых данных
app.post('/GetRegionalizedData', function(req, res) {
  var region = req.body.region;
  var db     = req.body.db;
  var dataId = req.body.dataId;
  
  if(db == "organizations") {
    Organizations.findOne ({ organization_name: dataId }, function(e, organization_item) {
      if(organization_item)          
        for(var anotherRegion in organization_item.regions_list)
          if(organization_item.regions_list[anotherRegion].region_name == region)
          {
              res.send(organization_item.regions_list[anotherRegion].organizations_list);
              break;
          }
    });
  }
  if (db=="texts") {
    Texts.findOne({ text_name: dataId}, function(e, text_item) {
        res.send(text_item);
    });
    console.log('запросили тексты');
  }
});

//        
//Сохранение данных кейса        
app.post('/UserData/:UserName/:CaseId/submitForm', function(req, res) {
  var userName = req.param('UserName', null);
  var caseId = req.param('CaseId', null);

  fs.readFile('data/UserData/' + userName + '/cases/' + caseId + '.json', "utf-8", function(err, caseContentsJson) {
    if (err) {
      fs.open('data/UserData/' + userName + '/cases/' + caseId + '.json', 'w');
      var caseContents = {};
      caseContents.name = caseId;
      err = false;
    }
    else {
      var caseContents = JSON.parse(caseContentsJson);
      if (caseContents == null) var caseContents = {};
      caseContents.name = caseId;
    }
    caseContents.data = JSON.parse(req.body.jsonData);

    var curStep = req.body.curStep;
    var nextStep = req.body.nextStep;
    
    for (var key in caseContents.steps) {
      if (caseContents.steps[key].id == nextStep) {
        caseContents.steps[key].prevStep = curStep;
        break;
      }
    }
    caseContents.currentStep = nextStep;
    
    //console.log(req.body.jsonData);
    fs.writeFile('data/UserData/' + userName + '/cases/' + caseId + '.json', JSON.stringify(caseContents, null, "\t"), function (err) {
          if (err) console.log(err);
    });
    res.send(req.body);
  });
});

//
//Завершение кейса
app.post('/UserData/:UserName/:CaseId/endCase', loadUser, generateMenu, function(req, res) {
  var userName = req.param('UserName', null);
  var caseId = req.param('CaseId', null);
    
  // [TODO]
  // 0. Проверить, что пользователь аутентифицирован
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    if (req.currentUser.email != userName) res.redirect('/sessions/new?return_to='+req.url);
    else {		
  		var solution_name = "";
	  	fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data){
	  	  if (!err) {		        
		      var userData = JSON.parse(data);
		      for(var i = 0; i < userData.cases.length; i++)
		      {
		        if ( userData.cases[i].caseId == caseId ) {
		          
		          // Меняем статус кейса и записываем это
		          userData.cases[i].state = "completed";
		          fs.writeFile('data/UserData/' + userName + '/user.json', JSON.stringify(userData, null, "\t"), encoding='utf8',
		            function (err) { if (err) throw err; } );
		          
		          solution_name = userData.cases[i].solutionId;
		                
              // Записываем статистику

              if ( req.body.isSolved == 'yes' ) {
                increaseSolutionStatistics ( solution_name, 'finished_successful' );
                if ( req.body.isSolutionUsed == 'yes' ) increaseSolutionStatistics ( solution_name, 'finished_good_solution' );
                else increaseSolutionStatistics ( solution_name, 'finished_bad_solution' );
              }
              else {
                increaseSolutionStatistics ( solution_name, 'finished_failed' );
                if ( req.body.isSolutionCorrect == 'yes' ) increaseSolutionStatistics ( solution_name, 'finished_good_solution' );
                else increaseSolutionStatistics ( solution_name, 'finished_bad_solution' ); 
              }      
		          break;
	          }
          }
		    }
		    else console.log("Error at case finish: " + err);
		  });
      // 3. Отправить на главную страницу
      res.redirect('/UserData/'+userName);
    }
  }
});

app.get('/UserData/:UserName/:CaseId/endCase', function(req, res) {
  res.redirect('/UserData/'+req.param('UserName')+'/'+req.param('CaseId'));
});

//
// Обработка запроса на показ информации о пользователе и списка всех его кейсов
app.get('/MyCases', loadUser, generateMenu, function(req, res){
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    fs.readFile('data/UserData/'+req.currentUser.email+'/user.json', "utf-8", function(err, data){
      if(!err) {
        res.render('mycases', {
          'title': 'Мои дела',
          'user':req.currentUser,
          'menu':res.menu, 
          'userData': JSON.parse(data),
          'scripts': [],
          'styles': []
        });
      }
      else Render404(req,res, err);
    });
  }
});

function parseReturnTo ( req_query_return_to ) {
  if (req_query_return_to == undefined) return '/';
  else return req_query_return_to;
}

// Users
app.get('/users/new', loadUser, generateMenu, function(req, res) {
  res.render('users/new.jade', {
    locals: { return_to: parseReturnTo(req.query.return_to) },
    'user':req.currentUser,
    'menu':res.menu, 
    title: '',
    scripts: [],
    styles:[]
  });
});

function createCaseFile ( userName, caseId, solutionId ) {

  fs.readFile('data/solutions/'+solutionId+'.json', "utf-8", function(err, data) {
    if(!err) {
      var solutionData = JSON.parse(data);
      
      var caseContents = {};
      caseContents.name = caseId;
      caseContents.steps = [];
      
      for (var key in solutionData.steps) {
        caseContents.steps.push( {id:solutionData.steps[key].id, prevStep:""} );
      }
      
      caseContents.currentStep = solutionData.initialStep;
      
      fs.open('data/UserData/' + userName + '/cases/' + caseId + '.json', 'w');      
      fs.writeFile('data/UserData/' + userName + '/cases/' + caseId + '.json', JSON.stringify(caseContents, null, "\t"), function (err) {
        if (err) console.log(err);
      });
    }
  });
}

app.post('/addcasetouser/:SolutionName', loadUser, generateMenu, function(req, res) {
  
  var solutionId = req.param('SolutionName', null);
  //solution -> case
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    //Добавляем кейс в спиок кейсов юзера
    
    var userName = req.currentUser.email;
    var caseId = req.body.case_id;
    
    fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data) {
      if (!err) {
        var userJSON = JSON.parse(data);
        var case_obj = {
          solutionId: solutionId,
          caseId: caseId,
          state: "active"
        };
        userJSON.cases.push (case_obj);
                
        fs.writeFile(
          'data/UserData/' + userName + '/user.json',
          JSON.stringify (userJSON, null, "\t"), encoding='utf8',
          function (err) {
            if (err) throw err;
        });
        
        createCaseFile ( userName, caseId, solutionId );
      }
      else Render404(req,res, err);
    });
    increaseSolutionStatistics ( solutionId, 'started' );
    res.redirect('/UserData/'+userName+'/'+caseId);
	}; 
});



app.post('/users.:format?', loadUser, generateMenu, function(req, res) {
  var user = new User(req.body.user);

  function userSaveFailed() {
    req.flash('error', 'Не удалось создать аккаунт');
    res.render('users/new.jade', {
      locals: { return_to: parseReturnTo(req.query.return_to) },
      'user':req.currentUser,
      'menu':res.menu, 
      title: '',
      scripts: [],
      styles:[]
    });
  }

  user.save(function(err) {
    if (err) return userSaveFailed();
    
    // creating user environment
    userCreateEnv( user.email );    
    
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
app.get('/sessions/new', loadUser, generateMenu, function(req, res) {

  res.render('sessions/new.jade', {
    'user':req.currentUser,
    'menu':res.menu,
    locals: { return_to: parseReturnTo(req.query.return_to) },
    title: '',
    scripts: [],
    styles:[]
  });
});

function checkUserEnv ( user_id ) {
  stats = fs.lstatSync('data/UserData/'+user_id);        
  if ( !stats.isDirectory() ) {
    fs.unlinkSync('data/UserData/'+user_id);
    console.log('Deleting file '+'data/UserData/'+user_id);
    throw "User's directory doesn't exist";
  }
        
  stats = fs.lstatSync('data/UserData/'+user_id+'/cases');
  if ( !stats.isDirectory() ) {
    fs.unlinkSync('data/UserData/'+user_id+'/cases');
    console.log('Deleting file '+'data/UserData/'+user_id+'/cases');
    throw "User's cases directory doesn't exist";
  }
        
  data = fs.readFileSync('data/UserData/' + user_id + '/user.json', "utf-8");
  if ( data == "" ) throw "Empty user.json file"; 
  var userData = JSON.parse(data);
  if ( userData.id == null ) throw "Incorrect user.json file";
}

app.post('/sessions', function(req, res) {

  var return_to = parseReturnTo(req.query.return_to);

  User.findOne({ email: req.body.user.email }, function(err, user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;
      
      try {
        checkUserEnv ( user.email );
      }
      catch (e) {
        console.log (user.email + ": " + e);
        userCreateEnv ( user.email );
      }
      
      req.flash('info', 'Вы вошли в систему. Здравствуйте!');
      // Remember me
      if (req.body.remember_me) {
        var loginToken = new LoginToken({ email: user.email });
        loginToken.save(function() {
          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          res.redirect(return_to);
        });
      }
      else {
        res.redirect(return_to);
      }           
    }
    else {
      req.flash('error', 'E-mail и пароль не подходят');
      res.redirect('/sessions/new?return_to='+return_to);
    }   
  });
   
});

app.get('/login', loadUser, generateMenu, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.query.return_to);
  else res.redirect('/');
});

app.get('/logout', loadUser, generateMenu, function(req, res) {
  if (req.session) {
    LoginToken.remove({ email: req.currentUser.email }, function() {});
    res.clearCookie('logintoken');
    req.session.destroy(function() {});
  }
  res.redirect('/');
});

// Statistics

app.get('/statistics/solutions', loadUser, generateMenu, function(req, res) {
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
          'user':req.currentUser,
          'menu':res.menu,
          solutions: solutions, 
          scripts:[],
          styles:[]
        })
      });
    });
  }
});



// Admin pages
app.get('/admin', loadUser, generateMenu, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {   
    res.render('admin/index.jade', {
      title: "Админка",
      'user':req.currentUser,
      'menu':res.menu,
      scripts:[],
      styles:[]
    })
  }
});

app.get('/admin/organizations/add', loadUser, generateMenu, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    var regions_list = fs.readFileSync('data/regions.json', "utf-8");
    
    Organizations.find({}, [], { sort: ['organization_name', 'descending'] },
                  function(err, organizations) {
      organizations = organizations.map(function(d) {
        return d.organization_name;
      });
      res.render('admin/organizations/add.jade', {
        'title':    "Организации / добавить",
        'user':     req.currentUser,
        'menu':     res.menu,
        'scripts':  [],
        'styles':   [],
        'regions_list': JSON.parse(regions_list),
        'existing_organization_names': organizations,
        'adding_result': req.query.adding_result
      })
    });
  }
});

app.post('/admin/organizations/add', loadUser, generateMenu, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    var new_organization = {
      'title': req.body.title,
      'short_descr': req.body.short_descr,
      'description': {
        'text': req.body.text,
        'web': req.body.web,
        'phone': req.body.phone,
        'postal_address': req.body.postal_address,
        'electronic_address': {
          'email': req.body.email,
          'webform': req.body.webform
        }
      }
    }
    Organizations.findOne ({ organization_name: req.body.organization_name }, function(e, organization_item) {
      if (!organization_item) {
        var organization_item = new Organizations({
          'organization_name': req.body.organization_name,
          'regions_list': [
            {

              'region_name': req.body.region_name,
              'organizations_list': []
            }
          ]
        });
		  }
		  var add_key = -1;
		  for (var key in organization_item.regions_list) {
        if ( organization_item.regions_list[key].region_name == req.body.region_name ) {
          add_key = key;
          break;
        }
      }
      if ( add_key == -1 ) {
        var new_region = {
          'region_name': req.body.region_name,
          'organizations_list': []
        }
        new_region.organizations_list.push(new_organization);
        organization_item.regions_list.push(new_region);
		  }
      else organization_item.regions_list[key].organizations_list.push(new_organization);
      organization_item.save(function(err) {
        if (err != null) {
          console.log(err);
          res.redirect('/admin/organizations/add?adding_result=error');
          // выдавать ошибку
		    }
        else {
          res.redirect('/admin/organizations/add?adding_result=success');
          // отправляем на /add обратно и говорим, что добавлено успешно
        }
      });
    });
  }
});

app.get('/admin/texts/add', loadUser, generateMenu, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    res.render('admin/texts/add.jade', {
      'title':    "Тексты / добавить",
      'user':     req.currentUser,
      'menu':     res.menu,
      'scripts':  [],
      'styles':   [],
      'adding_result': req.query.adding_result,
      'data': {
        'text_name': '',
        'title': '',
        'short_descr': '',
        'text': ''  
      }
    })
    
  }
});

app.post('/admin/texts/add', loadUser, generateMenu, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    var new_text = new Texts({
      'text_name': req.body.text_name,
      'title': req.body.title,
      'short_descr': req.body.short_descr,
      'text': req.body.text
    });
    
    Texts.find({ 'text_name': new_text.text_name }, function (err, arr) {
      if ( arr.length > 0 ) {
        res.render('admin/texts/add.jade', {
          'title':    "Тексты / добавить",
          'user':     req.currentUser,
          'scripts':  [],
          'styles':   [],
          'adding_result': "text_name_exists",
          'data':     {
            'text_name': req.body.text_name,
            'title': req.body.title,
            'short_descr': req.body.short_descr,
            'text': req.body.text
          }
        });
      }
      else {
        new_text.save(function(err) {
          if (err != null) {
            console.log(err);
            res.redirect('/admin/texts/add?adding_result=error');
            // выдавать ошибку
          }
          else {
            res.redirect('/admin/texts/add?adding_result=success');
            // отправляем на /add обратно и говорим, что добавлено успешно
          }
        });
      }
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

