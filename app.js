/*global console */
/*jslint node: true */
var express = require('express'),
    serverPort = 3000;

var app = express();

global.projectFolder = __dirname + '/';

app.use(express.static(__dirname + '/public'));



var server = app.listen(serverPort);

console.log("start server " + serverPort);