// ***********************************************************
// *** SETUP: this script goes throug all boostrap images, ***
// ***              scales them, analyzes them             ***
// ***                and adds them to the DB              ***
// ***********************************************************

// on RangeError: Maximum call stack size exceeded ==> node --stack-size=1000 02_analyze_bootstrap_pictures.js

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var util = require('../util');
var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase');

var ROOTDIR = path.join('../', config.mosaic.folders.root);

// CLEANS THE TILES:
console.log('> cleaning DB:')
mongobase.clearBootstrapTiles();

var sourcefolder = path.join(ROOTDIR, config.mosaic.folders.bootstrap);

fs.readdir(sourcefolder, function (err, files) {
	if(err) return console.log(err);


	async.forEachLimit(files, 10, function (file, $){
		var absoluteFile = path.join( sourcefolder, file );
		if(file.match(/tile_/)) return $(); // the tiles are the ones that are scaled to 20x20
		if(!file.match(/.jpg$|.png$/)) return $(); // only allow those file extensions

		var outputfile = path.join( config.mosaic.folders.bootstrap, 'tile_' + file ); // just prepend it with 'tile_'
		var outputfilehq = path.join( config.mosaic.folders.bootstrap, 'tile_hq_' + file);

		util.cropAndAverageColor(absoluteFile, path.join(ROOTDIR, outputfile), path.join(ROOTDIR, outputfilehq), function (err, averageColor){
			if(err) return $(err);

			// save bootstrap tile:
			var bootstraptile = {
				tile: outputfile,
				tilehq: outputfilehq,
				hsb: averageColor.hsb,
				rgb: averageColor.rgb
			};

			mongobase.saveBootraptile( bootstraptile, function (err, res) {
				if(err) return $(err);

				console.log( outputfile );

				return $();
			});
		});
	}, function (err){
		if(err) return console.log(err);
		return console.log('> DONE, you can CTRL-C this');
	});
});



