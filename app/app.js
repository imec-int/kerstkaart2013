#!/usr/bin/env node

var express = require('express');
var http = require('http')
var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var crypto = require('crypto');
var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase');
var util = require('./util');

var ROOTDIR = path.join('./', config.mosaic.folders.root);

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
	res.render('index', { title: '| MiX Kerstkaart 2013' });
});

app.post('/upload', function (req, res){
	console.log("upload");

	console.log(req.xhr);
	if(!req.xhr) return sendError(new Error('got no xhr request'), res);

	var size = req.header('x-file-size');
	var type = req.header('x-file-type');
	var name = path.basename(req.header('x-file-name'));

	name = crypto.createHash('md5').update( ''+(Date.now()) ).digest('hex') + '_' + name;
	var filename = path.join(ROOTDIR, config.mosaic.folders.user, name);

	var ws = fs.createWriteStream( filename );

	req.on('data', function (data) {
		ws.write(data);
	});

	req.on('end', function () {
		console.log("Upload done");
		ws.end();

		insertImageAsTile(filename, function (err, tile){
			if(err) return sendError(err, res);

			renderMosaic(function (err, mosaic) {
				if(err) return sendError(err, res);

				util.getXY(tile.index, function (err, xy){
					if(err) return sendError(err, res);

					var data = {
						mosaicimage           : mosaic.mosaicimage,
						mosaicimage_overlayed : mosaic.mosaicimage_overlayed,
						tile                  : tile,
						xy                    : xy
					};

					res.json(data);
				});
			});
		});
	});

});

function insertImageAsTile (inputfile, callback) {
	var file = path.basename(inputfile);

	var outputfile = path.join( config.mosaic.folders.user, 'tile_' + file + '.jpg' ); // just prepend it with 'tile_'
	var outputfilehq = path.join( config.mosaic.folders.user, 'tile_hq_' + file + '.jpg' );

	var usertile;
	var closestTile;

	async.waterfall([
		function ($) {
			util.cropAndAverageColor(inputfile, path.join(ROOTDIR, outputfile), path.join(ROOTDIR, outputfilehq), $);
		},

		function (averageColor, $) {
			// save user tile:
			usertile = {
				tile: outputfile,
				tilehq: outputfilehq,
				hsb: averageColor.hsb,
				rgb: averageColor.rgb
			};

			console.log( usertile );

			// not really necessary:
			mongobase.saveUserTile( usertile, $);
		},

		function (dbres, $) {
			// get all tiles that are not yet overridden with a user tile:
			mongobase.getAllEmptyTiles($);
		},

		function (tiles, $) {

			// find closest tile to our user tile:
			closestTile = util.findClosestTile(tiles, null, usertile.hsb, usertile.rgb);

			// add the user tile info to the tile:
			closestTile.user = {
				tile: usertile.tile,
				tilehq: usertile.tilehq
			}

			// save that tile to db:
			mongobase.updateTile(closestTile, $);
		},

		function (dbres, $) {
			$();
		}

	], function (err, mosaicimage){
		if(err) return callback(err);
		return callback(null, closestTile);
	});
}


function renderMosaic (callback) {

	// currently just a copy paste of 05_build_mosaic (should be smarter):
	var tilesWide, tilesHeigh, mainimage, mainimagehq, mosaicimage, mosaicimage_overlayed;
	var inputfiles, inputfilesHQ;

	var now = Math.round( Date.now()/1000 );
	mosaicimage = path.join(config.mosaic.folders.mosaic, 'mosaic_'+now+'.jpg');
	mosaicimage_overlayed = path.join(config.mosaic.folders.mosaic, 'mosaic_'+now+'_overlayed.jpg');

	async.waterfall([
		function ($) {
			mongobase.getConfig($);
		},

		function (config, $) {
			tilesWide = config.tilesWide;
			tilesHeigh = config.tilesHeigh;
			mainimage = config.mainimage;

			// get all tiles from DB:
			mongobase.getAllTiles($);
		},

		function (tiles, $) {
			// get all tiles we need to make the mosaic:
			inputfiles = [];

			// for some reason the tiles are not sorted by index or _id:
			// if we don't sort this, we'll get some funky mosaic
			tiles = _.sortBy(tiles, function (tile) {
				return tile.index;
			});

			for (var i = 0; i < tiles.length; i++) {
				var tile = tiles[i];

				if(tile.user){
					inputfiles.push( path.join(ROOTDIR, tile.user.tile) );
				}else if(tile.bootstrap){
					inputfiles.push( path.join(ROOTDIR, tile.bootstrap.tile) );
				}
			};


			console.log("> stitching mosaic");
			image.stitchImages(inputfiles, tilesWide, tilesHeigh, path.join(ROOTDIR, mosaicimage), $);
		},

		function (res, $) {
			// overlay stitched image with original:
			console.log("> overlaying mosaic");
			image.overlayImages(
				path.join(ROOTDIR, mainimage),
				path.join(ROOTDIR, mosaicimage),
				path.join(ROOTDIR, mosaicimage_overlayed),
			$);
		},

		function (imageres, $) {
			$();
		}

	], function (err) {
		if(err) return callback(err);

		return callback(null, {
			mosaicimage: mosaicimage,
			mosaicimage_overlayed: mosaicimage_overlayed
		});
	});
}


/**
 * Handig om meteen errors naar de client te sturen en ook te loggen
 */
function sendError(err, webresponse){
	var o = {
		err: err.toString()
	};
	console.log(err);

	if(err.stack){
		console.log(err.stack);
		o.errstack = err.stack;
	}

	webresponse.json(o);
}

