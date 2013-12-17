// ******************************************
// *** SETUP: scales and crops main image ***
// ***        splits it into tiles        ***
// ***            analyzes tiles          ***
// ***         adds them to the DB        ***
// ***********************************************************
// **** BE CAREFUL, THIS CLEANS THE TILES IN THE DATABASE ****
// ***********************************************************
var path = require('path');
var async = require('async');
var util = require('util');
var printf = require('printf');

var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase')
var utils = require('../utils');

var ROOTDIR = path.join('../', config.mosaic.folders.root);

var tilesWide, tilesHeigh, totalTiles, mainImageWidth, mainImageHeight, croppedMainImage, d, tiles;
var hqWidth, hqHeight, hqMainImage;


function run (mainCallback) {
	async.waterfall([

		function ($) {
			// CLEANS THE TILES:
			console.log('> cleaning DB:')
			mongobase.clearTiles($);
		},

		function (dbres, $){
			console.log('> cleaning main folder:')
			utils.cleanFolder( path.join(ROOTDIR, config.mosaic.folders.main), $);
		},

		function ($) {
			console.log('> calculating dimensions:')

			// proposed dimensions for mosaic, based on aspect ratio and number of wanted tiles
			tilesHeigh = Math.round( Math.sqrt(config.mosaic.maxtiles/(config.mosaic.aspectratio)) );
			tilesWide = Math.round( config.mosaic.maxtiles / tilesHeigh );
			totalTiles = tilesWide*tilesHeigh;

			console.log('> mosaic will be ' + tilesWide + ' tiles wide and ' + tilesHeigh + ' tiles heigh');
			console.log('> that\'s a total of ' + totalTiles + ' tiles');

			hqWidth = tilesWide * config.mosaic.tilehq.width;
			hqHeight = tilesHeigh * config.mosaic.tilehq.height;

			console.log('> the HQ of the mosaic will be ' + hqWidth+'x'+hqHeight);


			// 4 digits = %04d
			d = '%0'+(''+totalTiles).length+'d';

			// width and height the main image should be, based on the number of tiles and tile size:
			mainImageWidth = tilesWide * config.mosaic.tile.width;
			mainImageHeight = tilesHeigh * config.mosaic.tile.height;

			$();
		},

		function ($) {
			cropMainImage($);
		},

		function (image, $) {
			croppedMainImage = image;

			createHQMainImage($)
		},

		function (image, $) {
			hqMainImage = image;

			// save this config to db:
			mongobase.saveConfig({
				tilesWide: tilesWide,
				tilesHeigh: tilesHeigh,
				mainimage: croppedMainImage,
				mainimagehq: hqMainImage
			}, $);
		},
		function (res, $) {
			sliceMainImage($);
		},

		function (data, $){

			// recreate the filenames ImageMagick made using the tileFiles string:
			tiles = [];
			for (var i = 0; i < totalTiles; i++) {
				var tileFile = printf(data.tileFiles, i);
				tiles.push( {index: i, main: tileFile} );
			};

			// console.log(tiles);

			// don't do more than 10 cuncurrent operations or we will get errors:
			async.eachLimit(tiles, 10, function (tile, $for){
				getAverageColor(tile.main, function (err, averageColor){
					if(err) return $for(err);
					tile.hsb = averageColor.hsb;
					tile.rgb = averageColor.rgb;
					return $for();
				});
			}, $);
		},

		function ($) {
			// console.log(tiles);

			// save these tiles to the DB:
			console.log('> saving all tiles to the DB')
			async.eachLimit(tiles, 100, function (tile, $for){
				mongobase.saveTile(tile, function (err, data){
					if(err) return $for(err);
					return $for();
				});
			}, $);
		}
	], mainCallback);
}

function cropMainImage (callback){
	console.log('> cropping main image to: ' + mainImageWidth + 'x' + mainImageHeight);
	var croppedImage = path.join(config.mosaic.folders.main, 'main_cropped.png');
	var absoluteCroppedImage = path.join(ROOTDIR, croppedImage);
	image.crop( path.join(ROOTDIR, config.mosaic.mainimage), mainImageWidth, mainImageHeight, absoluteCroppedImage, function (err, data){
		if(!callback) return;
		if(err) return callback(err);
		return callback(null, croppedImage);
	});
}

function createHQMainImage (callback){
	console.log('> cropping main image to: ' + hqWidth + 'x' + hqHeight);
	var croppedImage = path.join(config.mosaic.folders.main, 'main_hq_cropped.jpg');
	var absoluteCroppedImage = path.join(ROOTDIR, croppedImage);
	image.crop( path.join(ROOTDIR, config.mosaic.mainimage), hqWidth, hqHeight, absoluteCroppedImage, function (err, data){
		if(!callback) return;
		if(err) return callback(err);
		return callback(null, croppedImage);
	});
}

function sliceMainImage (callback) {
	var tileFiles = path.join( config.mosaic.folders.main, 'tile_'+d+'.png' );
	var outputfiles = path.join(ROOTDIR, tileFiles);

	console.log('> slicing main image into tiles of ' + config.mosaic.tile.width + 'x' + config.mosaic.tile.height + ' into ' + outputfiles);

	image.slice( path.join(ROOTDIR, croppedMainImage), config.mosaic.tile.width, config.mosaic.tile.height, outputfiles, function (err, data){
		if(!callback) return;
		if(err) return callback(err);
		return callback(null, {
			tileFiles: tileFiles,
			absoluteTileFiles: outputfiles
		});
	});
}

function getAverageColor(tile, callback){
	var res = {};

	var filename = path.join(ROOTDIR, tile);

	image.getAverageRGBColor(filename, function (err, rgb){
		if(err) return callback(err);
		res.rgb = rgb;

		image.getAverageHSBColor(filename, function (err, hsb){
			if(err) return callback(err);
			res.hsb = hsb;

			return callback(null, res);
		});
	});
}


exports.run = run;











