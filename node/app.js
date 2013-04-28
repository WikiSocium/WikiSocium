/*
	Functions
 */

function RenderError(req,res,err) {
	console.log(err);
  res.render('Error', {
    'title':'Ошибка!',
    'user': req.currentUser,
    'menu':res.menu,
    'headerStats': res.headerStats,
		'err': err,
		'scripts': [],
    'styles': []
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
    ,Category
    ,Problem
    ,Solution
    ,Organizations
    ,Texts
var http = require('http');
var request = require('request');
var crypto = require('crypto');
var im = require('imagemagick');
var url = require('url');
var mime = require('mime');
var iconv = require('iconv-lite');
var rtf = require('./rtf');

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
  app.set('view options', { 'layout': false });
  app.use(express.bodyParser(
    { uploadDir: './uploads' }
  ));
  app.use(express.cookieParser()); 
  app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  app.set('db-uri', 'mongodb://wikisocium-development-user:EiW5SW430d7576u@cloud.wikisocium.ru/wikisocium-development');
  // app.set('db-uri', 'mongodb://wikisocium-development-user:EiW5SW430d7576u@localhost/wikisocium-development');
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
  app.set('db-uri', 'mongodb://localhost/wikisocium-production');
});

var db = mongoose.connect(app.set('db-uri'), function(err) {
  if (err) throw err;
});

models.defineModels(mongoose, function() {
  //app.Document = Document = mongoose.model('Document');
  app.User = User = mongoose.model('User');
  app.LoginToken = LoginToken = mongoose.model('LoginToken');
  app.Category = Category = mongoose.model('Category');
  app.Problem = Problem = mongoose.model('Problem');
  app.Solution = Solution = mongoose.model('Solution');
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


function authenticateFromLoginToken(req, res, next) {
  var cookie = JSONParseSafe(req.cookies.logintoken);

  LoginToken.findOne({ user_id: cookie.user_id,
                       series: cookie.series,
                       token: cookie.token }, (function(err, token) {
    if (!token) {
      req.currentUser = {}
      req.currentUser.guest = 1;
      next();
      return;
    }

    User.findOne({ user_id: token.user_id }, function(err, user) {
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
      'guest': true,
      'submenu': [
        {
          'id': 'Mission',
          'name': 'Предпосылки и миссия проекта',
          'guest': true
        },
        {
          'id': 'Goals',
          'name': 'Цели и задачи',
          'guest': true
        },
        {
          'id': 'Perspective',
          'name': 'Перспектива',
          'guest': true
        },
        {
          'id': 'Team',
          'name': 'Команда',
          'guest': true
        },
        {
          'id': 'Help',
          'name': 'Как помочь?',
          'guest': true
        },
        {
          'id': 'Partnership',
          'name': 'Сотрудничество',
          'guest': true
        },
        {
          'id': 'Questions',
          'name': 'Вопросы и сомнения',
          'guest': true
        }
      ]
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
      var submenu = [];
      for (var j in menu[i].submenu) {
        var is_active_sub = false;
        if (is_active && req.url.indexOf(menu[i].submenu[j].id) == menu[i].id.length+2) is_active_sub = true;
        submenu.push({
          'id': menu[i].submenu[j].id,
          'name': menu[i].submenu[j].name,
          'active': is_active_sub
        });
      }
      res.menu.push({
        'id': menu[i].id,
        'name': menu[i].name,
        'submenu': submenu,
        'active': is_active
      });
    }
  }
  next();
}

function getHeaderStats(req, res, next) {
  res.headerStats = {
    problems_number: 0,
    solutions_number: 0,
    cases_number: 0,
    users_number: 0
  }
  Problem.count({}, function(err, problems_number) {
    res.headerStats.problems_number = problems_number;
    Solution.count({}, function(err, solutions_number) {
      res.headerStats.solutions_number = solutions_number;
      User.count({}, function(err, users_number) {
        res.headerStats.users_number = users_number;
        next();
      });
    });
  });
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

// Solutions

function updateSolutionsCollection () {
  fs.readdir("data/solutions", function (err, files) {
    if (err) throw err;
    
    var solutions = new Array();
    for (var key in files) {
      var filenameParts = files[key].split(".");
      if(filenameParts[filenameParts.length - 1] == "json") {
          solutions[key] = new Object();
          solutions[key].filename = files[key];          
      }
    }

    async.forEach(solutions, function(solution, callback) {
      fs.readFile('data/solutions/'+solution.filename, "utf-8", function(err, data) {
        if(!err) {
          var solutionData = JSONParseSafe(data);
          solution.name = solutionData.name;
          solution.description = solutionData.description;
          Solution.findOne ({ name: solution.name }, function(err, document) {
            if (document) {
              if ( document.filename != solution.filename) document.filename = solution.filename;
              if ( document.description != solution.description) document.description = solution.description;
            }
            else {
              document = new Solution({
                'name': solution.name,
                'description': solution.description,
                'filename': solution.filename
              });
            }
            document.save(function(err) {
              if (err != null) console.log(err);
              callback(err);
            });
          });          
        }
        else callback(err);
      }); 
    },
    function(err) {      
      Solution.find({}, function(err,documents) {
        async.forEach(documents, function(document,callback) {
          fs.readFile('data/solutions/'+document.filename, "utf-8", function(err, data) {
            if(!err) var solutionData = JSONParseSafe(data);
            if (err || solutionData.name != document.name) {
              document.remove();
            }
            callback();
          });
        },
        function(err) {
          
        });
      });
    
      if (!err) console.log('Synced solutions collection and json files successfully');
      else console.log('Error in syncing solutions collection and json files '+err);
    });
  });
}

function increaseSolutionStatistics ( solution_name, field_name ) {
  Solution.findOne ({ name: solution_name }, function(err, solution) {
    if (!solution) {
      console.log('Didn\'t find a solution to increase stats:'+solution_name);
      return;
    }
    solution.statistics[field_name]++;
    solution.save(function(err) {
      if (err != null) console.log(err);
    });
  });
}

function getProblemStatistics ( problemName, callback ) {
  var returnStat = {
    solved: 0,
    inprocess: 0,
    notsolved: 0
  }
  Problem.findOne({ name: problemName }, ['solutions'], function (err, problem){
    if (problem == null) callback("Problem not found", returnStat);
    else {
      async.forEach(problem.solutions, function(solution, callback) {
        Solution.findOne ({ name: solution }, function(err, document) {
          if (document) {
            returnStat.solved += document.statistics.finished_successful;
            returnStat.inprocess += ( document.statistics.started - document.statistics.finished_successful - document.statistics.finished_failed );
            returnStat.notsolved +=  document.statistics.finished_failed;
          }
          callback(err);
        });
      },
      function (err) {
        callback(err, returnStat);
      });
    }
  });
}

// / Solutions


function getTopProblem ( problemsList, callback ) {
  async.forEach(problemsList, function(aProblem, callback) {
    var problemName = aProblem.name;
    getProblemStatistics ( problemName, function(err, stat) {
      aProblem.stats = stat;
      aProblem.score = stat.solved + stat.inprocess - stat.notsolved;
      callback();
    });
  },
  function(err) {
    problemsList.sort(function compare(a,b) {
      if (a.score > b.score)
        return -1;
      if (a.score < b.score)
        return 1;
      return 0;
    });
    callback(err, problemsList[0]);
  });
}
function pad(value) {
  return value < 10 ? '0' + value : value;
}
function getCurrentDateTime() {
  date = new Date();  
  var d = date.getDate(); if (d < 10) d = '0'+d;
  var m = date.getMonth()+1; if (m < 10) m = '0'+m;
  var y = date.getFullYear();
  var h = date.getHours(); if (h < 10) h = '0'+h;
  var min = date.getMinutes(); if (min < 10) min = '0'+min;
  var s = date.getSeconds(); if (s < 10) s = '0'+s;

  var sign = (date.getTimezoneOffset() > 0) ? "-" : "+";
  var offset = Math.abs(date.getTimezoneOffset());
  var hours = pad(Math.floor(offset / 60));
  var minutes = pad(offset % 60);
  var gmt_offset = sign + hours + ":" + minutes;

  return y+'-'+m+'-'+d+'T'+h+':'+min+':'+s+gmt_offset;
}




// Routes


//
// Обработка корня
app.get('/', loadUser, generateMenu, getHeaderStats, function(req, res) {

  Category.find({on_index: true}, ['name', 'icon'],
    { sort: { index_order: 1 } }, function(err, categories)
    {    
    async.forEach( categories, function(aCategory, callback) {
      Problem.find({ categories: aCategory.name }, ['name', 'in_development'], {}, function(err, problems) {
        aCategory.problemsNumber = problems.length;
        getTopProblem ( problems, function(err,topProblem) {
          aCategory.topProblem = topProblem;
          callback();
        });
      });
    },
    function(err) {
      if (!err) {        
        for (var key in categories) {
          if ( categories[key].problemsNumber == 0 ) categories.splice(key, 1);
        }
        res.render('index', {
          'title': "ВикиСоциум development",
          'user': req.currentUser,
          'menu': res.menu,
          'headerStats': res.headerStats,
          'categoryList': categories,
          'scripts': [],
          'styles': []
        });
      }
      else {
        console.log(err);
        RenderError(req,res, err);
      }
    });
  });
});

app.get('/About', loadUser, generateMenu, getHeaderStats, function(req, res) {
  res.redirect('/About/Mission'); 
});

app.get('/About/:PageName', loadUser, generateMenu, getHeaderStats, function(req, res) {
  for (i in res.menu) {
    if ( res.menu[i].active )
      for ( j in res.menu[i].submenu )
        if (res.menu[i].submenu[j].active) var subtitle = res.menu[i].submenu[j].name;
  }
  res.render('about/'+req.param('PageName', null), {
    'title': "О проекте: "+subtitle,
    'user':req.currentUser,
    'menu':res.menu,
    'headerStats': res.headerStats,
    'scripts':[],
    'styles':[]
  });    
});

//
// Обработка запроса на показ списка проблем
app.get('/Problems', loadUser, generateMenu, getHeaderStats, function(req, res){
  
  Category.find({}, ['name', 'icon'], { sort: { index_order: 1 } }, 
    function(err, categories) {    
    async.forEach( categories, function(aCategory, callback) {
      Problem.find({ categories: aCategory.name }, ['name', 'in_development'], {}, function(err, problems) {
        aCategory.problemsNumber = problems.length;
        getTopProblem ( problems, function(err,topProblem) {
          aCategory.topProblem = topProblem;
          callback();
        });
      });
    },
    function(err) {
      if (!err) {
        for (var key in categories) {
          if ( categories[key].problemsNumber == 0 ) categories.splice(key, 1);
        }
        res.render('problems', {
          'title': "Проблемы и решения",
          'user': req.currentUser,
          'menu': res.menu,
          'headerStats': res.headerStats,
          'categories': categories,
          'scripts': [],
          'styles': []
        });
      }
      else {
        console.log(err);
        RenderError(req,res, err);
      }
    });
  });
});

app.post('/Problems', loadUser, generateMenu, getHeaderStats, function(req, res){
  var query = req.body.search_query;
  Problem.find({ name: new RegExp(query, "i") }, ['name','categories', 'in_development'], {}, function(err, problems) {    
    async.forEach ( problems, function(aProblem, callback) {
      getProblemStatistics ( aProblem.name, function(err, stat) {
        aProblem.stats = stat;
        callback(err);
      });
    },
    function (err) {
      res.render('search_in_problems', {
        'title': "Поиск «"+query+"» в проблемах и решениях",
        'user': req.currentUser,
        'menu': res.menu,
        'headerStats': res.headerStats,
        'query': query,
        'problems': problems,
        'scripts': [],
        'styles': []
      });
    });
    
    
  });
});

// Обработка запроса на показ проблемы и списка ее решений
app.get('/Problems/:ProblemName', loadUser, generateMenu, getHeaderStats, function(req, res){
  var problemName = req.param('ProblemName', null).replace(/_/g," ");
  
  Problem.findOne({ name: problemName }, function(err, problem) {
    if (problem != null) {
      Solution.findOne({ name: problem.solutions[0] }, function(err, solution) {
        getProblemStatistics ( problemName, function(err, stat) {
          if (err) console.log(err);
          else {
            problem.stats = stat;
            res.render('problem', {
              'title' : problem.name,
              'user':req.currentUser,
              'menu':res.menu,
              'headerStats': res.headerStats,
              'problem' : problem,
              'solution': solution,
              'scripts' : ['/javascripts/modal_window.js'],
              'styles'  : []
            });
          }
        });
      });
    }
    else RenderError(req,res, problemName+": Проблема не найдена");
  });
});


// Обработка запроса на показ списка проблем из категории
app.get('/Categories/:CategoryName', loadUser, generateMenu, getHeaderStats, function(req, res){
	var categoryName = req.param('CategoryName', null).replace(/_/g," ");
  
	Category.findOne({ name: categoryName }, ['name', 'icon'], function(err, category) {
    Problem.find({ categories: categoryName }, ['name', 'in_development'], {}, function(err, problems) {
      async.forEach ( problems, function(aProblem, callback) {
        getProblemStatistics ( aProblem.name, function(err, stat) {
          aProblem.stats = stat;
          callback(err);
        });
      },
      function (err) {
        res.render('category', {
          'title' : categoryName+" в проблемах и решениях",
          'user':req.currentUser,
          'menu':res.menu,
          'headerStats': res.headerStats,
          'problems' : problems,
          'category': category,
          'scripts' : [],
          'styles':[]
        });
      });   
    });
  });  
});

// Обработка запроса на показ списка проблем из категории
app.post('/Categories/:CategoryName', loadUser, generateMenu, getHeaderStats, function(req, res){
	var categoryName = req.param('CategoryName', null).replace(/_/g," ");  
  var query = req.body.search_query;
  
  Category.findOne({ name: categoryName }, ['name', 'icon'], function(err, category) {
    Problem.find({ name: new RegExp(query, "i"), categories: categoryName }, ['name','categories', 'in_development'], {}, function(err, problems) {    
      async.forEach ( problems, function(aProblem, callback) {
        getProblemStatistics ( aProblem.name, function(err, stat) {
          aProblem.stats = stat;
          callback(err);
        });
      },
      function (err) {
        res.render('category', {
          'title': "Поиск «"+query+"» в категории "+categoryName,
          'user': req.currentUser,
          'menu': res.menu,
          'headerStats': res.headerStats,
          'query': query,
          'problems': problems,
          'category': category,
          'scripts': [],
          'styles': []
        });
      });
    });
  }); 
});



// Обработка запроса на показ конкретного кейса конкретного пользователя
app.get('/MyCases/:CaseId', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    var user_id = req.currentUser.user_id;
    var userName = req.currentUser.name;
    var caseId = req.param('CaseId', null).replace(/_/g," ");
    fs.readFile('data/UserData/' + user_id + '/user.json', "utf-8", function(err, data){
      if (!err) {
        var userJSON = JSONParseSafe(data);
        var solutionName = false;
        for (var key in userJSON.cases) {
            if (userJSON.cases[key].caseId == caseId) {
              solutionName = userJSON.cases[key].solutionId;
              break;
            }
        }
        if (solutionName)
          Solution.findOne ({ name: solutionName }, function(err, document) {
            if (document) {    
              fs.readFile('data/solutions/'+document.filename, "utf-8", function(err, data) {
                if(!err) 
                {
                  var solutionData = JSONParseSafe(data);
                  var stylesToInject = [
                    '/stylesheets/widgets.css'
                  ];
                  
                  var scriptsToInject = [
                    'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js',
                    //'http://jquery-ui.googlecode.com/svn/trunk/ui/i18n/jquery.ui.datepicker-ru.js',
                    'http://jquery-ui.googlecode.com/svn/tags/1.8.20/ui/i18n/jquery.ui.datepicker-ru.js',
                    'http://yui.yahooapis.com/3.4.0/build/yui/yui.js',                    
                    'http://api-maps.yandex.ru/2.0-stable/?load=package.standard&lang=ru-RU',
                    '/javascripts/jquery.json-2.3.min.js',
                    '/javascripts/jquery.valid8/jquery.valid8.source.js',
                    '/javascripts/CaseDataController.js',
                    '/javascripts/stepsController/StepsController.js',
                    '/javascripts/stepsController/CountVisibility.js',
                    '/javascripts/stepsController/SetWidgetValueForPredicatesOnStep.js',
                    '/javascripts/stepsController/WidgetHelpers.js',
                    '/javascripts/customWidgets/timer.js',
                    '/javascripts/runtime.min.js',
                    '/javascripts/jquery.watch-2.0.min.js',
                    '/javascripts/jquery.prettyPhoto.js',
                    '/javascripts/jquery.tmpl.min.js',
                    '/javascripts/modal_window.js',
                    '/javascripts/RegionalizedData.js',
                    '/javascripts/solutionsDynamicScripts/' + document.filename.split(".")[0] + '.js'
                  ];
                  
                  // Для каждого документа, который нужен кейсу, вставляем скрипт с генерацией этого документа
                  var requiredDocuments = solutionData.data.documents;
                  if(requiredDocuments)
                  {
                    for(var i = 0; i < requiredDocuments.length; i++) scriptsToInject.push("/documents/" + requiredDocuments[i] + ".js");
                    if(requiredDocuments.length != 0)
                    {
                        scriptsToInject.push("/documents/DocumentsController.js");
                        scriptsToInject.push("/javascripts/customWidgets/DocumentViewWidget.js");
                        scriptsToInject.push("/javascripts/customWidgets/WaitListWidget.js");                        
                    }
                    scriptsToInject.push("/javascripts/nicEdit.js");
					          scriptsToInject.push("/javascripts/customWidgets/TextField.js");
                    scriptsToInject.push("/javascripts/customWidgets/ListWidget.js");
					          scriptsToInject.push("/javascripts/customWidgets/RegionsListWidget.js");
                    scriptsToInject.push("/javascripts/customWidgets/RadioGroupWidget.js");
                    scriptsToInject.push("/javascripts/customWidgets/CheckBoxWidget.js");
                    scriptsToInject.push("/javascripts/customWidgets/CheckBoxGroupWidget.js");
                    scriptsToInject.push("/javascripts/customWidgets/YandexMapsWidget.js");
                    stylesToInject.push("http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css");
                    stylesToInject.push("/stylesheets/prettyPhoto.css");
                  }
                  fs.readFile('data/UserData/' + user_id + '/cases/' + caseId + '.json', "utf-8", function(err, caseContentsJson) {
                    if (err) {
                      var caseContents = {};
                      err = false;
                    }
                    else {
                      var caseContents = JSONParseSafe(caseContentsJson);
                      if (caseContents == null) var caseContents = {};
                    }

                    res.render('userCase', 
                    {
                      'title': userName + ": " + caseId,
                      'user':req.currentUser,
                      'menu':res.menu,
                      'headerStats': res.headerStats,
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
                else RenderError(req,res, err);
              });
            }
          });
        else RenderError(req,res,'У вас нет дела с таким именем')
      }
      else RenderError(req,res, err);
    });
  }
});

//Запрос списка регионов
app.post('/GetRegions', function(req, res) {
    var regions_list = fs.readFileSync('data/regions.json', "utf-8");
    res.send(JSONParseSafe(regions_list));
});

//
// Механизм запросов регионализируеммых данных
app.post('/GetRegionalizedData', function(req, res) {
  var region = req.body.region;
  var db     = req.body.db;
  var dataId = req.body.dataId;
  
  if(db == "organizations") {
    Organizations.findOne ({ organization_name: dataId }, function(e, organization_item) {
      if(e)
        {
            console.log("There was an error while fetching data from organizations db: ");
            console.log(e);
        }
      var foundOrganizations = [];
      if(organization_item)          
        for(var anotherRegion in organization_item.regions_list)
          if((organization_item.regions_list[anotherRegion].region_name == region) ||
             (organization_item.regions_list[anotherRegion].region_name == "Вся Россия"))
          {
              foundOrganizations.push(organization_item.regions_list[anotherRegion].organizations_list);
              // res.send(organization_item.regions_list[anotherRegion].organizations_list);
              // break;
          }
          
      res.send(foundOrganizations);
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
app.post('/MyCases/:CaseId/submitForm', loadUser, function(req, res) {
  var userName = req.currentUser.user_id;
  var caseId = req.param('CaseId', null).replace(/_/g," ");

  fs.readFile('data/UserData/' + userName + '/cases/' + caseId + '.json', "utf-8", function(err, caseContentsJson) {
    if (err) {
      fs.open('data/UserData/' + userName + '/cases/' + caseId + '.json', 'w');
      var caseContents = {};
      caseContents.name = caseId;
      err = false;
    }
    else {
      var caseContents = JSONParseSafe(caseContentsJson);
      if (caseContents == null) var caseContents = {};
      caseContents.name = caseId;
    }

    caseContents.data = req.body.jsonData;
    var curStep = req.body.curStep;
    var nextStep = req.body.nextStep;

    for (var key in caseContents.steps) {
      if (caseContents.steps[key].id == nextStep) {
        caseContents.steps[key].prevStep = curStep;
        break;
      }
    }
    caseContents.currentStep = nextStep;
    
    fs.writeFile(
      'data/UserData/' + userName + '/cases/' + caseId + '.json',
      JSON.stringify(caseContents, null, "\t"),
      function (err) {
        if (err) console.log(err);
        else fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, userJson) {
          if (err) {
            console.log(err);
          }
          else {
            var userFileContents = JSONParseSafe( userJson );
            for (var key in userFileContents.cases)
              if ( userFileContents.cases[key].caseId == caseId ) userFileContents.cases[key].updateDate = getCurrentDateTime();
            fs.writeFile('data/UserData/' + userName + '/user.json', JSON.stringify(userFileContents, null, "\t"), function (err) {});
          }
        });
      }
    );
    res.send(req.body);
  });
});

app.post('/MyCases/:CaseName/endCase', loadUser, generateMenu, getHeaderStats, function(req, res) {
  var userName = req.currentUser.user_id;
  var CaseName = req.param('CaseName', null).replace(/_/g," ");
    
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    var solution_name = "";
    fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data) {
      if (!err) {
        var userData = JSONParseSafe(data);
        for(var i = 0; i < userData.cases.length; i++)
        {
          if ( userData.cases[i].caseId == CaseName ) {
            
            // Меняем статус кейса и записываем это
            userData.cases[i].state = "completed";
            userData.cases[i].updateDate = getCurrentDateTime();
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
    res.redirect('/MyCases');    
  }
});

app.post('/MyCases/:CaseName/reopen', loadUser, function(req, res) {
  var userName = req.currentUser.user_id;
  var CaseName = req.param('CaseName', null).replace(/_/g," ");

  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data) {
      if (!err) {
        var userData = JSONParseSafe(data);
        for(var i = 0; i < userData.cases.length; i++)
        {
          if ( userData.cases[i].caseId == CaseName ) {
            
            // Меняем статус кейса и записываем это
            userData.cases[i].state = "active";
            userData.cases[i].updateDate = getCurrentDateTime();
            fs.writeFile(
              'data/UserData/' + userName + '/user.json',
              JSON.stringify(userData, null, "\t"),
              encoding='utf8',
              function (err) { if (err) throw err; }
            );   
            break;
          }
        }
      }
      else console.log("Error at case reopen: " + err);
    });
    res.redirect('/MyCases');
  }
});

app.get('/MyCases/:CaseId/endCase', function(req, res) {
  res.redirect('MyCases/'+req.param('CaseId'));
});

//
// Обработка запроса на показ информации о пользователе и списка всех его кейсов
app.get('/MyCases', loadUser, generateMenu, getHeaderStats, function(req, res){
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    fs.readFile('data/UserData/'+req.currentUser.user_id+'/user.json', "utf-8", function(err, data){
      if(!err) 
      {
        var userData=JSONParseSafe(data);
        if (userData.cases != undefined) {
          async.forEach (userData.cases, function (curCase, callback)
          {
            console.log(curCase.caseId);
            fs.readFile('data/UserData/'+req.currentUser.user_id+'/cases/'+curCase.caseId+'.json', "utf-8", function(err1, data1)
            {
              if (!err1)
              {
                console.log(data1);
                var caseData=JSONParseSafe(data1);
                console.log(caseData.currentStep);
                Solution.findOne ({ name: curCase.solutionId }, function(err3, document) 
                {
                  if (document) 
                  {
                    console.log(document.filename);
                    fs.readFile('data/solutions/'+document.filename, "utf-8", function(err2, data2) 
                    {
                      if (!err2)
                      {
                        var solutionData=JSONParseSafe(data2);
                        var currentStepNum=0;
                        for (var cs in solutionData.steps)
                        {
                          if (solutionData.steps[cs].id==caseData.currentStep)
                          {
                            currentStepNum=cs;
                            break;
                          }
                        }
                        console.log(solutionData.steps[currentStepNum].title);
                        var sectionNum=-1;
                        var stepInSection=-1;
                        for (var s in solutionData.sections)
                        {
                          for (var s0 in solutionData.sections[s].steps)
                          {
                            if (solutionData.sections[s].steps[s0]==caseData.currentStep)
                            {
                              sectionNum=s;
                              stepInSection=s0;
                              stepInSection++;
                              break;
                            }
                          }
                        }
                        curCase.sectionName=solutionData.sections[sectionNum].name;
                        curCase.sectionLength=solutionData.sections[sectionNum].steps.length;
                        curCase.stepInSection=stepInSection;
                        curCase.stepName=solutionData.steps[currentStepNum].title;
                        callback(err2);
                      }
                      else 
                        callback(err2);
                    });
                  }
                  else
                    callback(err3);
                });
              }
              else
                callback(err1);
            });
          },
          function(err0)
          {
            if(err0==null)
            {
              var file = fs.readFileSync('views/mycases_userCasesList.jade', 'utf8');
              res.render('mycases', {
                  'title':  'Мои дела',
                  'user':   req.currentUser,
                  'menu':   res.menu, 
                  'headerStats': res.headerStats,
                  'userCasesList': userData.cases,
                  'casesListTamplate': jade.compile(file, { client: true }),
                  'scripts': [
                    '/javascripts/runtime.min.js',
                    '/javascripts/modal_window.js'
                  ],
                  'styles': []
              });
            }
          });
        }
      }
      else RenderError(req,res, err);
    });
  }
});

function JSONParseSafe(JSONToParse)
{
    try
    {
        return JSON.parse(JSONToParse);
    }
    catch(e)
    {
        console.log("FAILED TO PARSE JSON: " + e);
        return {};
    }
}

function parseReturnTo ( req_query_return_to ) {
  if (req_query_return_to == undefined) return '/';
  else return req_query_return_to;
}

function createCaseFile ( userName, caseId, solutionName ) {
  Solution.findOne ({ name: solutionName }, function(err, document) {
    if (document) {
      fs.readFile('data/solutions/'+document.filename, "utf-8", function(err, data) {
        if(!err) {
          var solutionData = JSONParseSafe(data);
          
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
        else {
          console.log('Solution json file for '+solutionName+' not found');
        }
      });    
    }
    else {
      console.log('Solution '+solutionName+' not found');
    }
  });
}

app.post('/MyCases/AddCase', loadUser, generateMenu, getHeaderStats, function(req, res) {
  //solution -> case
  if (req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    //Добавляем кейс в спиок кейсов юзера
    var userName = req.currentUser.user_id;
    var caseName = req.body.case_id.replace(/_/g," ");
    var ProblemName = req.body.ProblemName;
    var solutionName = req.body.SolutionName;
    
    if (caseName == "") {
      RenderError(req,res,"Невозможно добавить дело с пустым названием");
      return;
    }    
    
    fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data) {
      if (!err) {
        var userJSON = JSONParseSafe(data);
        var case_obj = {
          problemName: ProblemName,
          solutionId: solutionName,
          caseId: caseName,
          state: "active",
          createDate: getCurrentDateTime()
        };
        userJSON.cases.push (case_obj);
                
        fs.writeFile(
          'data/UserData/' + userName + '/user.json',
          JSON.stringify (userJSON, null, "\t"), encoding='utf8',
          function (err) {
            if (err) throw err;
        });
        
        createCaseFile ( userName, caseName, solutionName );
      }
      else RenderError(req,res, err);
    });
    increaseSolutionStatistics ( solutionName, 'started' );
    res.redirect('/MyCases/'+caseName.replace(/ /g,"_"));
	}; 
});

app.post('/OpenDocument', loadUser, generateMenu, getHeaderStats, function(req, res) {
    var html = req.body.text;
    var rtfText = rtf.generate(html);
    var buffer = iconv.encode(rtfText, 'win1251');

    fs.writeFile('public/Claim.rtf', buffer, 'binary', function (err) {
        if (err) console.log(err);
    });
    
    res.send('Claim.rtf');
});

// Users
app.get('/users/new', loadUser, generateMenu, getHeaderStats, function(req, res) {
  res.render('users/new.jade', {
    locals: { return_to: parseReturnTo(req.query.return_to) },
    'user':req.currentUser,
    'menu':res.menu, 
    'headerStats': res.headerStats,
    title: '',
    scripts: [],
    styles:[]
  });
});

app.post('/users.:format?', function(req, res) {
  console.log('Came to /users.:format ' + req.body.social_name + ' ' + req.body.user);

  var user = new User(req.body.user);

  function SaveNewUser(user) {
    user.save(function(err) {
      var return_to = parseReturnTo(req.query.return_to);

      if (err) {
        switch (req.params.format) {
          case 'json':
            var response = user.toObject();
            response['error'] = err;
            res.send(response);
          break;

          default:
            res.redirect('/users/new?error&return_to=' + return_to);//return userSaveFailed();
        }
      }
      else {
        // creating user environment
        userCreateEnv( user.user_id );    
        
        //emails.sendWelcome(user);     

        switch (req.params.format) {
          case 'json':
            res.send(user.toObject());
          break;

          default:
            req.session.user_id = user.id;
            res.redirect(return_to);
        }
      }
    });
  }

  User.findOne().sort('user_id', -1).exec( function(err, user_max) {
    var user_max_id;
    if (user_max.user_id != undefined) user_max_id = user_max.user_id;
    else user_max_id = -1;
    user.user_id = user_max_id + 1;

    if ( req.body.social_name != undefined && user.email != undefined ) {
      User.findOne({ email: user.email }, function(err, found_user) {
        if (found_user) {
          var response = { 'error' : 'email_exists' };
          res.send(response);
        }
        else SaveNewUser(user);
      });
    }
    else SaveNewUser(user);

       
  });  
});



// Sessions
app.get('/sessions/new', loadUser, generateMenu, getHeaderStats, function(req, res) {

  res.render('sessions/new.jade', {
    'user':req.currentUser,
    'menu':res.menu,
    'headerStats': res.headerStats,
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
  var userData = JSONParseSafe(data);
  if ( userData.id == null ) throw "Incorrect user.json file";
}

app.post('/sessions', function(req, res) {

  var return_to = parseReturnTo(req.query.return_to);

  function CreateSession(user) {
    req.session.user_id = user.id;
    
    try {
      checkUserEnv ( user.user_id );
    }
    catch (e) {
      console.log (user.user_id + ": " + e);
      userCreateEnv ( user.user_id );
    }
    
    // Remember me
    if (req.body.remember_me) {
      var loginToken = new LoginToken({ user_id: user.user_id });
      loginToken.save(function() {
        res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
        res.redirect(return_to);
      });
    }
    else {
      res.redirect(return_to);
    }
  }
  
  if (req.body.user.email != undefined) {
    User.findOne({ email: req.body.user.email }, function(err, user) {
      if (user && user.authenticate(req.body.user.password)) {
        CreateSession(user);
      }
      else {
        res.redirect('/sessions/new?error=login_password_not_match&return_to='+return_to);
      }   
    });
  }
  else {
    if ( req.body.social_name != undefined && req.body.user[req.body.social_name+'_uid'] != undefined ) {
      var field = req.body.social_name+'_uid';

      var search = new Object;
      search[field] = req.body.user[field];
      User.findOne(search, function(err, user) {
        if (user) {
          CreateSession(user);
        }
        else res.redirect(return_to);
      });
    }
    else res.redirect(return_to);
  }   
});

app.get('/login', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.query.return_to);
  else res.redirect('/');
});

app.get('/logout', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if (req.session) {
    LoginToken.remove({ user_id: req.currentUser.user_id }, function() {});
    res.clearCookie('logintoken');
    req.session.destroy(function() {});
  }
  res.redirect('/');
});

// Statistics

app.get('/Statistics/Solutions', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    Solution.find( {}, function(err, solutions) {      
      res.render('statistics/solutions.jade', {
        title: "Статистики по решениям",
        'user':req.currentUser,
        'menu':res.menu,
        'headerStats': res.headerStats,
        solutions: solutions, 
        scripts:[],
        styles:[]
      });
    });
  }
});


app.get('/social/:social_name', function(req, res) {
  var social_name = req.param('social_name', null);

  var render = function ( render_params ) {    
    res.render('social/'+social_name, render_params);
  };

  var loginUserSocially = function ( client_id, user ) {
    console.log('logging in');
    render_params = {
      'title' : "ВикиСоциум: Авторизация",
      'client_id' : client_id,
      'user' : user
    };

    if (user != undefined && user.uid != undefined) {
      console.log('user is defined '+JSON.stringify(user));

      var search = new Object;
      search[social_name+'_uid'] = user.uid;

      User.findOne(search, function(err, user_doc) {
        if (user_doc) {
          render ( render_params );
        }
        else {
          console.log('user '+JSON.stringify(user));

          var request_string = 'social_name='+social_name;
          for (var key in user) {
            var param = key;
            if (key == 'uid') param = social_name+'_uid';

            request_string += '&user['+param+']='+user[key];
          }
          console.log(request_string);
          request( {
            url  : 'http://'+req.headers.host+'/users.json',
            method : 'POST',
            body : request_string,
            headers: {'content-type': 'application/x-www-form-urlencoded'}
          }, function (error, response, body) {
            render ( render_params );
          });
        }
      });
    }
    else render ( render_params );
  };
 
  var return_uri = 'http://'+req.headers.host+'/social/'+social_name;

  switch ( social_name ) {
    case 'vk' :
      var client_id = '3181678';
      if (req.query.code != undefined) {
        var client_secret = 'OW3ZXxxaIz9lIpdSsAIS';
        request('https://oauth.vk.com/access_token?client_id=' + client_id +
          '&client_secret=' + client_secret + '&code='+req.query.code + '&redirect_uri='+return_uri ,
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              console.log(body);
              body = JSONParseSafe(body);
              
              request('https://api.vk.com/method/users.get?uids=' + body.user_id + 
                '&fields=uid,first_name,last_name&access_token='+body.access_token,
                function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    console.log(body);
                    var answer = JSONParseSafe(body).response[0];
                    var user = {
                      'uid' : answer.uid,
                      'name' : answer.first_name+' '+answer.last_name
                    };
                    console.log(user);
                    loginUserSocially(client_id, user);
                  } 
                  else console.log(error);
                }
              );
            }
            else console.log(error);
          }
        );
      }
      else loginUserSocially(client_id, undefined);
    break;
    case 'fb' :
      var client_id = '463407673699614';
      if (req.query.code != undefined) {
        var client_secret = 'be7c3bc32801dd7e40b0655a30d057ec';
        request('https://graph.facebook.com/oauth/access_token?client_id=' + client_id +
          '&client_secret=' + client_secret + '&code='+req.query.code + '&redirect_uri='+return_uri ,
          function (error, response, body) {
            if (!error && response.statusCode == 200) {              
              request('https://graph.facebook.com/me?'+body ,
                function(error, response, body) {
                  if (!error && response.statusCode == 200) {
                    var answer = JSONParseSafe(body);
                    var user = {
                      'uid' : answer.id,
                      'name' : answer.name
                    };
                    loginUserSocially(client_id, user);
                  }
                  else console.log(error);
                }
              );
            } 
            else console.log(error);
          }
        );
      }
      else loginUserSocially(client_id, undefined);
    break;
    case 'tw' :
      var consumer_key = 'TODOhK2htQ5lz9vQB7H3hQ';
      var consumer_secret = 'zfG3isqYmLKXjL7ybGtvjt29gJaTdeHW1tk4AtcZy0';
      
      var qs = require('querystring')
        , oauth =
          { callback: encodeURI(return_uri)
          , consumer_key: consumer_key
          , consumer_secret: consumer_secret
          }
        , url = 'https://api.twitter.com/oauth/request_token'
        ;
      request.post({url:url, oauth:oauth}, function (e, r, body) {
        // Assume by some stretch of magic you aquired the verifier
        // console.log(body);
        // console.log(req.query);

        if (req.query == undefined || req.query.oauth_verifier == undefined) {
          var access_token = qs.parse(body);
          res.redirect('https://api.twitter.com/oauth/authenticate?oauth_token='+access_token.oauth_token);
        }
        else {
          var access_token = qs.parse(body)
            , oauth = 
              { consumer_key: consumer_key
              , consumer_secret: consumer_secret
              , token: req.query.oauth_token
              , verifier: req.query.oauth_verifier
              }
            , url = 'https://api.twitter.com/oauth/access_token'
            ;
          
          request.post({url:url, oauth:oauth}, function (e, r, body) {
            var perm_token = qs.parse(body)
              , oauth = 
                { consumer_key: consumer_key
                , consumer_secret: consumer_secret
                , token: perm_token.oauth_token
                , token_secret: perm_token.oauth_token_secret
                }
              , url = 'https://api.twitter.com/1/users/show.json?'
              , params = 
                { screen_name: perm_token.screen_name
                , user_id: perm_token.user_id
                }
              ;
            url += qs.stringify(params)
            request.get({url:url, oauth:oauth, json:true}, function (e, r, tw_user) {
              var user = {
                'uid' : tw_user.id,
                'name' : tw_user.name
              };
              loginUserSocially(client_id, user);
            })
          })
        }
      });
    break;
  }
});

function fileExistsSync (d) {
  try { fs.statSync(d); return true }
  catch (er) { return false }
}
function dirExistsSync (d) {
  try { fs.statSync(d).isDirectory(); return true }
  catch (er) { return false }
}

function checkDirectoryExistsSync (d) {
  if ( fileExistsSync(d) ) {
    if ( !dirExistsSync(d) ) {
      fs.unlinkSync(d);
      fs.mkdirSync(d);
    }
  }
  else {
    fs.mkdirSync(d);
  }
}

app.post('/fileUpload', loadUser, function(req, res) {
  function getUniqueFileName (uploadDir, srcFileName) {
    var dstFileName = srcFileName;

    if (srcFileName.split('.').length > 0) {
      var filenameExtension = '.' + srcFileName.split('.').pop();
    } else {
      var filenameExtension = '';
    }
    var filenameName = srcFileName.replace(filenameExtension,'');

    var uploadPath = uploadDir + '/' + dstFileName;
    var k = 0;
    while (fs.existsSync(uploadPath)) {    
      dstFileName = filenameName+'-'+k+filenameExtension;
      k+=1;
      uploadPath = uploadDir + '/' + dstFileName;
    }
    return dstFileName;
  }

  var publicDir = './public';
  var publicUploadsDir = publicDir + '/uploads/';
  var userUploadsDir = publicUploadsDir + req.currentUser.user_id;
  var userThumbnailsDir = userUploadsDir + '/Thumbnails';

  checkDirectoryExistsSync (userUploadsDir);
  checkDirectoryExistsSync (userThumbnailsDir);

  switch (req.body.queryType) {
    case 'upload':
      var uploadedFile = req.files.uploadingFile;
      var tmpPath = uploadedFile.path;

      var fileName = uploadedFile.name;
      fileName = getUniqueFileName(userUploadsDir, fileName);

      var uploadPath = userUploadsDir + '/' + fileName;
      var publicUploadPath = uploadPath.replace(publicDir,'');

      var thumbnailPath = userThumbnailsDir + '/' + fileName;
      var publicThumbnailPath = thumbnailPath.replace(publicDir,'');

      var response = {
        'path': publicUploadPath,
        'thumbnail': publicThumbnailPath,
        'size': uploadedFile.size
      }

      fs.rename(tmpPath, uploadPath, function(err) {
        if (err) console.log(err);
        if (!err) {
          fs.unlink(tmpPath, function() {
            im.convert([uploadPath, '-resize', '150x150', thumbnailPath], 
            function(err, stdout){
              if (err) throw err;
              res.send(response);
            });
          });
        }
      });
    break;
    case 'link':
      var fileURL = req.body.url;
      var fileName = url.parse(fileURL).pathname.split('/').pop();
      if (fileName == '') {
        fileName = 'file';
      }
      fileName = getUniqueFileName(userUploadsDir, fileName);

      var uploadPath = userUploadsDir + '/' + fileName;
      var thumbnailPath = userThumbnailsDir + '/' + fileName;

      var publicUploadPath = uploadPath.replace(publicDir,'');
      var publicThumbnailPath = thumbnailPath.replace(publicDir,'');

      var fileWriteStream = fs.createWriteStream(uploadPath);

      http.get(fileURL, function(downloadResponse) {
          downloadResponse.on('data', function(data) {
              fileWriteStream.write(data);
            }).on('error', function(e) {
              fileWriteStream.end();
              fs.unlink(uploadPath);
              res.send({"error": e.message});
            }).on('end', function() {
              fileWriteStream.end();
              console.log(fileName + ' downloaded to ' + userUploadsDir);

              switch(req.body.downloadType) {
                case 'file':
                  var response = {
                    'path': publicUploadPath,
                    'error': ""
                  }
                  res.send(response);
                break;
                case 'picture':
                  if ( mime.lookup(uploadPath).search("image") == -1 ) {
                    fs.unlink(uploadPath);
                    res.send({"error": "file_is_not_image"});
                  }
                  else {
                    var response = {
                      'path': publicUploadPath,
                      'thumbnail': publicThumbnailPath,
                      'error': ""
                    }
                    im.convert([uploadPath, '-resize', '150x150', thumbnailPath], 
                    function(err, stdout){
                      if (err) {
                        fs.unlink(uploadPath);
                        res.send({"error": "imagemagick_error"});
                      }
                      else res.send(response);
                    });
                  }
                break;
                case 'thumbnail':
                  if ( mime.lookup(uploadPath).search("image") == -1 ) {
                    fs.unlink(uploadPath);
                    res.send({"error": "file_is_not_image"});
                  }
                  else {
                    var response = {
                      'thumbnail': publicUploadPath,
                      'error': ""
                    }
                    im.convert([uploadPath, '-resize', '150x150', uploadPath], 
                    function(err, stdout){
                      if (err) {
                        fs.unlink(uploadPath);
                        console.log(err);
                        res.send({"error": "imagemagick_error"});
                      }
                      else res.send(response);
                    });
                  }
                break;
              }
            }
          );
        }).on('error', function(e) {
          fileWriteStream.end();
          fs.unlink(uploadPath);
          res.send({"error": e.message});
      });
    break;
    case 'delete':
      var fileToDelete = publicDir + req.body.path;
      // Проверяем, что файл лежит в upload-директории текущего пользователя
      if ( fileToDelete.search(userUploadsDir) != -1 ) {
        if ( fileExistsSync(fileToDelete) && !fs.statSync(fileToDelete).isDirectory() ) {
          fs.unlink(fileToDelete, function(err) {
            if (err) console.log(err);
            else res.send("Deleted successfully");
          });
        }
        else res.send("File not found");
      }
      else res.send("You are trying to delete a file that is not yours. You are not right. Incident reported.")
    break;
  }  
});

app.register('.html', {
  compile: function(str, options){
    return function(locals){
      return str;
    };
  }
});
app.get('/fileUpload',function(req,res) {
  res.render('file_upload.html');
});

///////////////////////////////////////////////////////////////////////////////
// Admin pages
///////////////////////////////////////////////////////////////////////////////

app.get('/admin', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {   
    res.render('admin/index.jade', {
      title: "Админка",
      'user':req.currentUser,
      'menu':res.menu,
      'headerStats': res.headerStats,
      scripts:[],
      styles:[]
    })
  }
});

app.get('/admin/organizations/add', loadUser, generateMenu, getHeaderStats, function(req, res) {
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
        'headerStats': res.headerStats,
        'scripts':  ['/javascripts/admin.js'],
        'styles':   [],
        'regions_list': JSONParseSafe(regions_list),
        'existing_organization_names': organizations,
        'adding_result': req.query.adding_result
      })
    });
  }
});

app.post('/admin/organizations/add', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    var input_email = [];
    for (var key in req.body.email)
      input_email[key] = {
        'email_who': req.body.email_who[key],
        'email': req.body.email[key]
      };
    var input_phone = [];
    for (var key in req.body.phone)
      input_phone[key] = {
        'phone_who': req.body.phone_who[key],
        'phone': req.body.phone[key]
      };
    
    var new_organization = {
      'title': req.body.title,
      'short_description': req.body.short_description,
      'description': {
        'text': req.body.text,
        'web': req.body.web,
        'phone': input_phone,
        'postal_address': req.body.postal_address,
        'electronic_address': {
          'email': input_email,
          'webform': req.body.webform
        }
      }
    }
    var arr_counter = req.body.organization_name.length;
    var global_err;
    
    async.forEach(req.body.organization_name, function(organization_name, callback){      
      Organizations.findOne ({ organization_name: organization_name }, function(e, organization_item) {
        if (!organization_item) {
          var organization_item = new Organizations({
            'organization_name': organization_name,
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
          }        
          callback(err);
        });
      });
    },
    function(err){
      if (err == null) {
        res.redirect('/admin/organizations/add?adding_result=success');
        // отправляем на /add обратно и говорим, что добавлено успешно
      }
      else {
        res.redirect('/admin/organizations/add?adding_result=error');
        // выдавать ошибку
      }
    });
    
  }
});

app.get('/admin/texts/add', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    res.render('admin/texts/add.jade', {
      'title':    "Тексты / добавить",
      'user':     req.currentUser,
      'menu':     res.menu,
      'headerStats': res.headerStats,
      'scripts':  [],
      'styles':   [],
      'adding_result': req.query.adding_result,
      'data': {
        'text_name': '',
        'title': '',
        'short_description': '',
        'text': ''  
      }
    })
    
  }
});

app.post('/admin/texts/add', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    var new_text = new Texts({
      'text_name': req.body.text_name,
      'title': req.body.title,
      'short_description': req.body.short_description,
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
            'short_description': req.body.short_description,
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


app.get('/admin/problems', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    
    Problem.find({}, ['name'], { sort: ['name', 'descending'] },
                  function(err, problems) {
      problems = problems.map(function(d) {
        return d.name;
      });
    
      Category.find({}, ['name'], { sort: ['name', 'descending'] },
                    function(err, categories) {
        categories = categories.map(function(d) {
          return d.name;
        });
        
        Solution.find({}, ['name'], { sort: ['name', 'descending'] },
                      function(err, solutions) {
          solutions = solutions.map(function(d) {
            return d.name;
          });
          
          res.render('admin/problems/show.jade', {
            'title':    "Проблемы",
            'user':     req.currentUser,
            'menu':     res.menu,
            'headerStats': res.headerStats,
            'scripts':  ['/javascripts/admin.js'],
            'styles':   [],
            'categories': categories,
            'problems': problems,
            'solutions': solutions,
            'result': req.query.result
          })
        });
      });
    });
  }
});

app.get('/admin/problems/:ProblemName/edit', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    var problemName = req.param('ProblemName', null).replace(/_/g," ");
    
    Problem.findOne({ name: problemName },  function (err, problem){
          
      Category.find({}, ['name'], { sort: ['name', 'descending'] },
                    function(err, categories) {
        categories = categories.map(function(d) {
          return d.name;
        });
        
        Solution.find({}, ['name'], { sort: ['name', 'descending'] },
                      function(err, solutions) {
          solutions = solutions.map(function(d) {
            return d.name;
          });
          
          res.render('admin/problems/edit.jade', {
            'title':    "Проблемы",
            'user':     req.currentUser,
            'menu':     res.menu,
            'headerStats': res.headerStats,
            'scripts':  ['/javascripts/admin.js'],
            'styles':   [],
            'categories': categories,
            'problem': problem,
            'solutions': solutions
          })
        });
      });
    });
  }
});



app.post('/admin/problems/save', loadUser, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {   
    var f = function(err) {
      if (err != null) {
        console.log(err);
        res.redirect('/admin/problems?result=error');
      }        
      else res.redirect('/admin/problems?result=added');
    };    
    if ( req.body.categories[0] == "- нет" ) var categories = [];
    else var categories = req.body.categories;
    if ( req.body._id == undefined ) {
      var new_problem = new Problem({
        'name': req.body.name,
        'description': req.body.description,
        'categories': categories, 
        'solutions': req.body.solutions,
        'in_development': req.body.in_development
      });
      new_problem.save(f);
    }
    else {
      Problem.findOne({ _id: req.body._id },  function (err, problem){
        problem.name = req.body.name;
        problem.description = req.body.description;
        problem.categories = categories;
        problem.solutions = req.body.solutions;
        problem.in_development = req.body.in_development;
        problem.save(f);
      });
    }
  }
});

app.get('/admin/problems/:ProblemName/delete', loadUser, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    var problemName = req.param('ProblemName', null).replace(/_/g," ");
    
    Problem.findOne({ name: problemName },  function (err, problem){
      Problem.remove({ _id: problem._id }, function(err) {
      if (err != null) {
        console.log(err);
        res.redirect('/admin/problems?result=error');
      }        
      else res.redirect('/admin/problems?result=removed');
    });
    });
  }
});

app.get('/admin/categories', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {
    
    Category.find({}, [], { sort: {on_index: -1, index_order: 1} },
                  function(err, categories) {          
      res.render('admin/categories/show.jade', {
        'title':    "Категории",
        'user':     req.currentUser,
        'menu':     res.menu,
        'headerStats': res.headerStats,
        'scripts':  ['/javascripts/admin.js'],
        'styles':   [],
        'categories': categories,
        'result': req.query.result
      })
    });
  }
});

app.get('/admin/categories/:CategoryName/edit', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    var categoryName = req.param('CategoryName', null).replace(/_/g," ");
    
    Category.findOne({ name: categoryName },  function (err, category){
      res.render('admin/categories/edit.jade', {
        'title':    "Проблемы",
        'user':     req.currentUser,
        'menu':     res.menu,
        'headerStats': res.headerStats,
        'scripts':  ['/javascripts/admin.js'],
        'styles':   [],
        'category': category
      })
    });
  }
});

app.post('/admin/categories/save', loadUser, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {   
    var f = function(err) {
      if (err != null) {
        console.log(err);
        res.redirect('/admin/categories?result=error');
      }        
      else res.redirect('/admin/categories?result=added');
    };
    var on_index = false;
    if (req.body.on_index == "1") on_index = true;
    if ( req.body._id == undefined ) {
      var new_category = new Category({
        'name': req.body.name,
        'icon': req.body.icon,
        'on_index': on_index,
        'index_order': req.body.index_order
      });
      new_category.save(f);
    }
    else {
      Category.findOne({ _id: req.body._id },  function (err, category){
        category.name = req.body.name;
        category.icon = req.body.icon;
        category.on_index = on_index;
        category.index_order = req.body.index_order;
        category.save(f);
      });
    }
  }
});

app.get('/admin/categories/:CategoryName/delete', loadUser, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.url);
  else {    
    var categoryName = req.param('CategoryName', null).replace(/_/g," ");
    
    Category.findOne({ name: categoryName },  function (err, category){
      Category.remove({ _id: category._id }, function(err) {
      if (err != null) {
        console.log(err);
        res.redirect('/admin/categories?result=error');
      }        
      else res.redirect('/admin/categories?result=removed');
    });
    });
  }
});

updateSolutionsCollection();

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
                           "(org){$('#documentView_" + lines[0] +
                           "').html((" + fn + ")({'data':CollectFormData(), 'org':org}));}"
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