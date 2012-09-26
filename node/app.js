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
  app.set('db-uri', 'mongodb://wikisocium-development-user:EiW5SW430d7576u@cloud.wikisocium.ru/wikisocium-development');
  //app.set('db-uri', 'mongodb://wikisocium-development-user:EiW5SW430d7576u@localhost/wikisocium-development');
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
          var solutionData = JSON.parse(data);
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
            callback(err);
          });          
        }
        else callback(err);
      }); 
    },
    function(err) {      
      Solution.find({}, function(err,documents) {
        async.forEach(documents, function(document,callback) {
          fs.readFile('data/solutions/'+document.filename, "utf-8", function(err, data) {
            if(!err) var solutionData = JSON.parse(data);
            if (err || solutionData.name != document.name) {
              console.log(solutionData.name+' '+document.name+' '+err);
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

function getCurrentDateTime() {
  date = new Date();  
  var d = date.getDate(); if (d < 10) d = '0'+d;
  var m = date.getMonth()+1; if (m < 10) m = '0'+m;
  var y = date.getFullYear();
  var h = date.getHours(); if (h < 10) h = '0'+h;
  var min = date.getMinutes(); if (min < 10) min = '0'+min;
  var s = date.getSeconds(); if (s < 10) s = '0'+s;
  return y+'-'+m+'-'+d+' '+h+':'+min+':'+s;
}




// Routes


//
// Обработка корня
app.get('/', loadUser, generateMenu, getHeaderStats, function(req, res) {
  console.log(req.headers.host
  );
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
          'title': "ВикиСоциум: Простые решения для важных проблем",
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
// Это обработка редиректа с вконтакта (тест)
app.get('/auth/vkontakte', loadUser, function(req, res) {
	console.log('ololololo');
	var code = req.query.code;
	console.log(code);
	var request = require('request');
  	request({uri:'https://oauth.vk.com/access_token?client_id='+'2981571'+'&client_secret='+'mJloUt73SYT6K9vFmxfi'+'&code='+code}, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
  			console.log(body);
  			var answer = JSON.parse(body);
  			console.log(answer);
  			console.log('...');
  			console.log(answer.user_id); 
  			
  			request({uri:'https://api.vk.com/method/getProfiles?uid='+answer.user_id+'&access_token='+answer.access_token}, function (error, response, body) {
  				if (!error && response.statusCode == 200) {
  					console.log(body);
  					var answer = JSON.parse(body);
  					//У переменной answer есть три поля: uid, first_name и last_name.
  					console.log(answer);
  					res.redirect('/');
	   			}	
  			})
  						
   		}	
  	})
	
  //res.redirect('/');
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
  else 
  {    
    var userName = req.currentUser.email;
    var caseId = req.param('CaseId', null).replace(/_/g," ");
    fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data){
      if (!err) {
        var userJSON = JSON.parse(data);
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
                  var solutionData = JSON.parse(data);
                  var stylesToInject = [];
                  var scriptsToInject = [
                    'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/jquery-ui.min.js',
                    'http://jquery-ui.googlecode.com/svn/trunk/ui/i18n/jquery.ui.datepicker-ru.js',
                    'http://yui.yahooapis.com/3.4.0/build/yui/yui.js',
                    'http://api-maps.yandex.ru/1.1/index.xml?key=AEj3nE4BAAAAlWMwGwMAbLopO3UdRU2ufqldes10xobv1BIAAAAAAAAAAADoRl8HuzKNLQlyCNYX1_AY_DTomw==',
                    '/inputex/src/loader.js',
                    '/javascripts/jquery.json-2.3.min.js',
                    '/javascripts/jquery.valid8/jquery.valid8.source.js',
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
                    if(requiredDocuments.length != 0)
                    {
                        scriptsToInject.push("/documents/DocumentsController.js");
                        scriptsToInject.push("/javascripts/customWidgets/DocumentViewWidget.js");
                        scriptsToInject.push("/javascripts/customWidgets/WaitListWidget.js");                        
                    }
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
      if(e)
        {
            console.log("There was an error while fetching data from organizations db: ");
            console.log(e);
        }
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
app.post('/MyCases/:CaseId/submitForm', loadUser, function(req, res) {
  var userName = req.currentUser.email;
  var caseId = req.param('CaseId', null).replace(/_/g," ");

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
      else fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, userJson) {
        if (err) {
          console.log(err);
        }
        else {
          var userFileContents = JSON.parse( userJson );
          for (var key in userFileContents.cases)
            if ( userFileContents.cases[key].caseId == caseId ) userFileContents.cases[key].updateDate = getCurrentDateTime();
          fs.writeFile('data/UserData/' + userName + '/user.json', JSON.stringify(userFileContents, null, "\t"), function (err) {});
        }
      });
    });
    res.send(req.body);
  });
});

//save to file
//Завершение кейса
app.post('/MyCases/:CaseId/endCase', loadUser, generateMenu, getHeaderStats, function(req, res) {
  var userName = req.currentUser.email;
  var caseId = req.param('CaseId', null).replace(/_/g," ");
    
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
      res.redirect('/MyCases');
    }
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
    fs.readFile('data/UserData/'+req.currentUser.email+'/user.json', "utf-8", function(err, data){
      if(!err) 
      {
        var userData=JSON.parse(data);
        async.forEach (userData.cases, function (curCase, callback)
        {
          console.log(curCase.caseId);
          fs.readFile('data/UserData/'+req.currentUser.email+'/cases/'+curCase.caseId+'.json', "utf-8", function(err1, data1)
          {
            if (!err1)
            {
              var caseData=JSON.parse(data1);
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
                      var solutionData=JSON.parse(data2);
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
            res.render('mycases', {
                'title':  'Мои дела',
                'user':   req.currentUser,
                'menu':   res.menu, 
                'headerStats': res.headerStats,
                'userData': userData,
                'scripts': [],
                'styles': []
            });
          }
        });        
      }
      else RenderError(req,res, err);
    });
  }
});

function parseReturnTo ( req_query_return_to ) {
  if (req_query_return_to == undefined) return '/';
  else return req_query_return_to;
}

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

function createCaseFile ( userName, caseId, solutionName ) {

  Solution.findOne ({ name: solutionName }, function(err, document) {
    if (document) {
      fs.readFile('data/solutions/'+document.filename, "utf-8", function(err, data) {
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
    var userName = req.currentUser.email;
    var caseName = req.body.case_id.replace(/_/g," ");
    var ProblemName = req.body.ProblemName;
    var solutionName = req.body.SolutionName;
    
    if (caseName == "") {
      RenderError(req,res,"Невозможно добавить дело с пустым названием");
      return;
    }    
    
    fs.readFile('data/UserData/' + userName + '/user.json', "utf-8", function(err, data) {
      if (!err) {
        var userJSON = JSON.parse(data);
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


app.post('/OpenDocument', loadUser, generateMenu, getHeaderStats, function(req, res){
    var text=req.body.text;
    var html='<html><head><title>Документ</title><meta charset="utf-8"/></head><body><p>'+text+'</body></html>';
    fs.writeFile('public/Doc.html', html, function (err) {
        if (err) console.log(err);
    });
    res.send('Doc.html');
});

app.post('/users.:format?', loadUser, generateMenu, getHeaderStats, function(req, res) {
  var user = new User(req.body.user);

  function userSaveFailed() {
    req.flash('error', 'Не удалось создать аккаунт');
    res.render('users/new.jade', {
      locals: { return_to: parseReturnTo(req.query.return_to) },
      'user':req.currentUser,
      'menu':res.menu, 
      'headerStats': res.headerStats,
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

app.get('/login', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if ( req.currentUser.guest == 1 ) res.redirect('/sessions/new?return_to='+req.query.return_to);
  else res.redirect('/');
});

app.get('/logout', loadUser, generateMenu, getHeaderStats, function(req, res) {
  if (req.session) {
    LoginToken.remove({ email: req.currentUser.email }, function() {});
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
    /*fs.readdir("data/solutions", function (err, files) {
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
        Solution.findOne ({ solution_name: arg.name }, function(e, solution) {
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
    });*/
  }
});



// Admin pages
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
        'regions_list': JSON.parse(regions_list),
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

