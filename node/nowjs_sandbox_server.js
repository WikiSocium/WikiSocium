//var fs = require('fs');
//var server = require('http').createServer(function(req, response){
//                                          fs.readFile('helloworld.html', function(err, data){
//                                                      response.writeHead(200, {'Content-Type':'text/html'});  
//                                                      response.write(data);  
//                                                      response.end();
//                                                      });
//                                          });
//server.listen(8080);
//var everyone = require("now").initialize(server);
//
//
//everyone.connected(function(){
//                   console.log("Joined: " + this.now.name);
//                   });
//
//
//everyone.disconnected(function(){
//                      console.log("Left: " + this.now.name);
//                      });
//
//everyone.now.distributeMessage = function(message){everyone.now.receiveMessage(this.now.name, message);};

var nowjs = require("now");

//nowjs.on('connect', function () {
//         console.log(this.now);
//         this.now.receiveMessage('SERVER', 'Welcome to NowJS.');
//         });

var express = require('express');

var app = module.exports = express.createServer();

var everyone = nowjs.initialize(app);
//everyone.now.testFunction = function(){ console.log("test function called"); };
everyone.now.testData = "testString";
everyone.now.checkData = function()
{
    console.log(this.now.testData);
};

app.configure(function(){
              app.set('views', __dirname + '/views');
              app.set('view engine', 'jade');
              app.use(express.bodyParser());
              app.use(express.methodOverride());
              app.use(app.router);
              app.use(express.static(__dirname + '/public'));
              });

app.get('/nowjs', function(req, res){
        res.render('nowjs', {
                   title: "Now.js sandbox server in it's own local branch",
                   scripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js',
                             '/nowjs/now.js',
                             '/javascripts/nowjs_stuff.js']
                   });
        });

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);