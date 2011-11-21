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
var fs = require('fs');
var jQ = require('jquery');

var app = module.exports = express.createServer();

// Configuration
// [RESEARCH] Не имею ни малейшего понятия что происходит в этом конфигурировании,
// если кто-нибудь разберется и расскажет — будет круто.

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

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

//
// Обработка корня
app.get('/', function(req, res) {
		res.render('index', {'title':"Usage", scripts:[]});
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

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

