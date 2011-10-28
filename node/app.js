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
//        var caseName = req.param('caseName', null);
//        res.render('caseOverview', {
//                   title: "overview of selected case",
//                   selectedCase: allTemplates[caseName],
//                   scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
//                             '/javascripts/Curry-1.0.1.js',
//                             '/javascripts/raphael-min.js',
//                             '/javascripts/dracula_algorithms.js',
//                             '/javascripts/dracula_graffle.js',
//                             '/javascripts/dracula_graph.js',
//                             '/javascripts/seedrandom.js']
//                   });
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
// Обработка запроса на показ конкретного кейса конкретного пользователя
app.get('/UserData/:UserName/:CaseId', function(req, res) {
         var userName = req.param('UserName', null);
         var caseId = req.param('CaseId', null);

         fs.readFile('data/'+userName+'/'+caseId+'.json', "utf-8", function(err, data){                     
             if(!err)
             {
                var requestedCase = jQ.parseJSON(data);
                res.render('userCase', {
                               'title': userName + " : " + caseId,
                               'requestedCase' : requestedCase,
                               'scripts' : ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
                                            '/javascripts/controllers/' + requestedCase.id + '.js',
                                            '/javascripts/StepsController.js']
                           });
             }
             else
                    Render404(res, err);
            });
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

