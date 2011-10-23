
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

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

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express',
    scripts: []
  });
});

// uh, well, let this is out case

var allTemplates = {
"testCase": {
    "title" : "testCase",
    "description" : "Некое описание",
    "data" :
    {
        "law_doc" : "описание зконодательной базы",
        "photo" : "url://"
    },
    "currentStep":"0",
    "steps" :
    [
        {
            "title" : "step 0",
            "type" : "step_type_0",
            "state" : "0",
            "next_steps" : ["1", "2"],            
            "widgets" : 
            {
                "widget_type_0" : { "data": "aData" },
                "widget_type_1" : { "data": "anotherData" }
            }
        },
        {   
            "title" : "step 1",
            "type" : "step_type_0",
            "state" : "0",
            "next_steps" : [],            
            "widgets" : 
            {
                "widget_type_0" : { "data": "aData" },
                "widget_type_1" : { "data": "anotherData" }
            }
        },
        {            
            "title" : "step 2",     
            "type" : "step_type_0",
            "state" : "0",
            "next_steps" : [],            
            "widgets" : 
            {
                "widget_type_0" : { "data": "aData" },
                "widget_type_1" : { "data": "anotherData" }
            }
        }
    ]
}
}

app.get('/templates/:caseName/', function(req, res){
        var caseName = req.param('caseName', null);
        res.render('caseOverview', {
                   title: "overview of selected case",
                   selectedCase: allTemplates[caseName],
                   scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
                             '/javascripts/Curry-1.0.1.js',
                             '/javascripts/raphael-min.js',
                             '/javascripts/dracula_algorithms.js',
                             '/javascripts/dracula_graffle.js',
                             '/javascripts/dracula_graph.js',
                             '/javascripts/seedrandom.js']
                   });
});

app.get('/example/', function(req, res){
        res.render('example', {
                   title: "overview of selected case",
                   scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
                             '/nowjs/now.js']
               });
        });

app.get('/templates/:caseName/:step', function(req, res){
        var caseName = req.param('caseName', null);
        var step = req.param('step', null);
        allTemplates[caseName].currentStep = step;           

        res.render('case', {
                   title: "view of selected case",
                   selectedCase: allTemplates[caseName],
                   step: allTemplates[caseName].currentStep,
                   scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
               });        
}); 

app.post('/templates/:caseName/next', function(req, res){
         var caseName = req.param('caseName', null);
         var nextStep = parseInt(allTemplates[caseName].currentStep) + 1;
         allTemplates[caseName].currentStep = nextStep;        
         
         res.render('case', {
                    title: "view of selected case",
                    selectedCase: allTemplates[caseName],
                    step: allTemplates[caseName].currentStep,
                    scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js']
                    });        
});

app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

var everyone = require("now").initialize(app);
//everyone.now.testFunction = function(){ console.log("test function called"); };
everyone.now.testData = "testString";
everyone.now.checkData = function()
{
    console.log(this.now.testData);
}
