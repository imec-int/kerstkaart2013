var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase');
var utils = require('../utils');



var SOME_FOLDER_WITH_IMAGES = '../../data/raw_bootstrap_images/';




var ROOTDIR = path.join('../', config.mosaic.folders.root);

// The Only thing we can do beforehand, is cropping and analyzing the tile pictures:
console.log('> POPULATE AND ANALYZE TILES');

var bootstsrapimages;

async.waterfall([
	function ($) {
		console.log('> reading images from: ' + SOME_FOLDER_WITH_IMAGES);
		fs.readdir(SOME_FOLDER_WITH_IMAGES, $);
	},

	function (files, $) {
		bootstsrapimages = [];
		for (var i = files.length - 1; i >= 0; i--) {
			if(files[i].match(/.jpg$|.png$/)){
				bootstsrapimages.push( path.join(SOME_FOLDER_WITH_IMAGES, files[i]) );
			}
		};

		// CLEANS THE TILES:
		console.log('> cleaning tiles from DB:')
		mongobase.clearTiles($);
	},

	function (dbres, $) {
		var tilefolder = path.join(ROOTDIR, config.mosaic.folders.tiles);
		console.log('> cleaning tiles folder: ' + tilefolder);
		utils.cleanFolder(tilefolder, $);
	},

	function ($) {
		async.forEachLimit(bootstsrapimages, 10, function (image, $for){
			var filename = path.basename(image);
			var basenameNoExt = path.basename(image, path.extname(image));

			var outputfile = path.join( config.mosaic.folders.tiles, 'tile_' + basenameNoExt + '.jpg' );
			var outputfilehq = path.join( config.mosaic.folders.tiles, 'tile_hq_' + basenameNoExt + '.jpg' );

			console.log('> cropping image to tile: ' + filename);
			utils.cropAndAverageColor(image, path.join(ROOTDIR, outputfile), path.join(ROOTDIR, outputfilehq), function (err, averageColor){
				if(err) return $for(err);

				// save tile:
				var tile = {
					tile: outputfile,
					tilehq: outputfilehq,
					hsb: averageColor.hsb,
					rgb: averageColor.rgb
				};

				mongobase.saveTile( tile, function (err, res) {
					if(err) return $for(err);
					return $for();
				});
			});

		}, $);
	}

], function (err) {
	if(err) return console.log(err);
	return console.log("> DONE, you can CTRL-C this");
});