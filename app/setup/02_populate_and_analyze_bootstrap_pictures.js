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
var utils = require('../utils');
var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase');

var ROOTDIR = path.join('../', config.mosaic.folders.root);

function run (images, mainCallback) {
	async.waterfall([
		function ($) {
			// CLEANS THE TILES:
			console.log('> cleaning boostrap tiles from DB:')
			mongobase.clearBootstrapTiles($);
		},

		function (dbres, $) {
			var boostrapfolder = path.join(ROOTDIR, config.mosaic.folders.bootstrap);
			console.log('> cleaning boostrap tiles folder: ' + boostrapfolder);
			utils.cleanFolder(boostrapfolder, $);
		},

		function ($) {
			async.forEachLimit(images, 10, function (image, $for){
				var filename = path.basename(image);
				var basenameNoExt = path.basename(image, path.extname(image));

				var outputfile = path.join( config.mosaic.folders.bootstrap, 'tile_' + basenameNoExt + '.jpg' );
				var outputfilehq = path.join( config.mosaic.folders.bootstrap, 'tile_hq_' + basenameNoExt + '.jpg' );

				console.log('> cropping bootstrap image: ' + filename);
				utils.cropAndAverageColor(image, path.join(ROOTDIR, outputfile), path.join(ROOTDIR, outputfilehq), function (err, averageColor){
					if(err) return $for(err);

					// save bootstrap tile:
					var bootstraptile = {
						tile: outputfile,
						tilehq: outputfilehq,
						hsb: averageColor.hsb,
						rgb: averageColor.rgb
					};

					mongobase.saveBootraptile( bootstraptile, function (err, res) {
						if(err) return $for(err);
						return $for();
					});
				});

			}, $);
		}

	], mainCallback);
}

exports.run = run;




