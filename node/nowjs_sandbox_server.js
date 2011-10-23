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

var express = require('express');

var app = module.exports = express.createServer();

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
                             '/nowjs/now.js']
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
