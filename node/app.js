
/**
 * Module dependencies.
 */

var express = require('express');
var nowjs = require("now"); // now.js почему-то в таком виде не работает, это тема для ближайшего исследования

var app = module.exports = express.createServer();
var everyone = nowjs.initialize(app);

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
    title: 'Express'
  });
});

// uh, well, let this is out case

var allTemplates = {
"trafficViolation": {
    "title" : "trafficViolation",
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
                   });
});

app.get('/templates/:caseName/:step', function(req, res){
        var caseName = req.param('caseName', null);
        var step = req.param('step', null);
        allTemplates[caseName].currentStep = step;           

        res.render('case', {
                   title: "view of selected case",
                   selectedCase: allTemplates[caseName],
                   step: allTemplates[caseName].currentStep
               });        
}); 

app.post('/templates/:caseName/next', function(req, res){
         var caseName = req.param('caseName', null);
         var nextStep = parseInt(allTemplates[caseName].currentStep) + 1;
         allTemplates[caseName].currentStep = nextStep;        
         
         res.render('case', {
                    title: "view of selected case",
                    selectedCase: allTemplates[caseName],
                    step: allTemplates[caseName].currentStep
                    });        
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

everyone.now.testData = "testString";
