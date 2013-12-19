#!/usr/bin/env node

var express = require('express');
var http = require('http')
var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var crypto = require('crypto');
var config = require('./config');
var mosaic = require('./mosaic');
var mongobase = require('./mongobase');
var utils = require('./utils');

var ROOTDIR = path.join(__dirname, config.mosaic.folders.root);

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('kerstkaart2013bbbbb4645sf6s4fs'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

app.get('/', function(req, res){
	res.render('index', {
		title: '| MiX Kerstkaart 2013'
	});
});

app.post('/xhrupload', function (req, res){
	console.log("incomming XHR upload");

	if(!req.xhr) return utils.sendError(new Error('got no xhr request'), res);

	var size = req.header('x-file-size');
	var type = req.header('x-file-type');
	var name = path.basename(req.header('x-file-name'));


	//name = crypto.createHash('md5').update( ''+(Date.now()) ).digest('hex') + '_' + name;
	name = (Date.now()) + '_' + (utils.removeFileExt(name)).substr(0,6) + path.extname(name) ;
	var uploadedFile = path.join(ROOTDIR, config.mosaic.folders.main, name);

	var ws = fs.createWriteStream( uploadedFile );

	req.on('data', function (data) {
		ws.write(data);
	});

	req.on('end', function () {
		console.log("Upload done");
		ws.end();
		renderMosaic(uploadedFile, req, res);
	});
});

function renderMosaic (userimage, req, res) {
	// this function has 2 callbacks, one with the normal(lowres) version of the mosaic and one with the highres version of the mosaic
	// mosaic.renderMosaic( userimage, callback(err, mosaicimage), callbackHQ(err, mosaicimageHQ) )
	mosaic.renderMosaic( userimage, false,
		function (err, mosaicimage) {
			if(err) return utils.sendError(err, res);

			console.log( "Mosaic ready... sending it back to browser" );
			console.log( utils.wwwdfy(mosaicimage) );
			res.send({
				mosaicimage: utils.wwwdfy(mosaicimage)
			});

		}, function (err, mosaicimageHQ) {
			if(err) return utils.sendError(err, res);

			console.log( "HQ version mosaic ready... need to store this somewhere so the user can download it" );
			console.log( utils.wwwdfy(mosaicimageHQ) );
		}
	);
}

// YOUNES stuff:

app.get('/share', function(req, res){
	res.render('share', {
		title     	: 'Share Your MiX Kerstkaart 2013',
		message 	: 'iwasmixed - We wish you amazing holydays.',
		imgUrl		: 'http://d3j5vwomefv46c.cloudfront.net/photos/large/828376205.jpg',
		pageUrl		: 'http://twitpic.com/dp6z65'
	});
});
