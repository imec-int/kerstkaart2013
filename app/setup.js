var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase');
var utils = require('./utils');



var SOME_FOLDER_WITH_IMAGES = './raw_images/';


var ROOTDIR = path.join(__dirname, config.mosaic.folders.root);

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

			var hasTitle = true;
			if(filename.substr(0,1) == '_')
				hasTitle = false;

			var newBasenameNoExt = basenameNoExt;
			if(hasTitle){
				// clean up name:
				newBasenameNoExt = utils.cleanName(basenameNoExt);
			}

			var outputfile = path.join( config.mosaic.folders.tiles, 'tile_' + newBasenameNoExt + '.jpg' );
			var outputfilehq = path.join( config.mosaic.folders.tiles, 'hq_tile_' + newBasenameNoExt + '.jpg' );

			var outputfileflying = null;
			var outputfileflyingAbsolute = null;

			if(hasTitle)
				outputfileflying = path.join( config.mosaic.folders.tiles, 'flying_tile_' + newBasenameNoExt + '.jpg' );

			if(outputfileflying)
				outputfileflyingAbsolute = path.join(ROOTDIR, outputfileflying)

			console.log('> cropping and analyzing: ' + basenameNoExt);
			cropAndAverageColor(image, path.join(ROOTDIR, outputfile), path.join(ROOTDIR, outputfilehq), outputfileflyingAbsolute, function (err, averageColor){
				if(err) return $for(err);

				// save tile:
				var tile = {
					tile: outputfile,
					tilehq: outputfilehq,
					hsb: averageColor.hsb,
					rgb: averageColor.rgb
				};

				if(hasTitle){
					tile.title      = basenameNoExt.replace(/(.+)\s_\d/, '$1'); //removes ending underscore with digit
					tile.tileflying = outputfileflying;
				}

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



function cropAndAverageColor (inputfile, outputfile, outputfilehq, outputfileflying, callback) {
	var averageColor = {};

	async.waterfall([
		function ($) {
			// crop to tile size:
			image.crop(inputfile, config.mosaic.tile.width, config.mosaic.tile.height, outputfile, $);
		},

		function (imageres, $) {
			// crop to tile hq size:
			image.crop(inputfile, config.mosaic.tilehq.width, config.mosaic.tilehq.height, outputfilehq, $);
		},

		function (imageres, $) {
			if(!outputfileflying) return $(null, null);

			// crop to flying tile size:
			image.crop(inputfile, config.mosaic.flyingtile.width, config.mosaic.flyingtile.height, outputfileflying, $);
		},

		function (imageres, $) {

			// now get the average RGB color for it:
			image.getAverageRGBColor(outputfile, $);
		},

		function (rgb, $) {
			averageColor.rgb = rgb;

			// now get the average RGB color for it:
			image.getAverageHSBColor(outputfile, $);
		},

		function (hsb, $) {
			averageColor.hsb = hsb;

			$();
		}

	], function (err) {
		if(err) return callback(err);
		return callback(null, averageColor);
	});

}