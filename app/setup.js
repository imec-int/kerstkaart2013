// ***********************************************************
// *** SETUP: will setup main image with placeholder tiles ***
// ***********************************************************
// **** BE CAREFUL, THIS CLEANS THE TILES IN THE DATABASE ****
// ***********************************************************
var path = require('path');
var async = require('async');
var util = require('util');
var printf = require('printf');

var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase')

var tilesWidth, tilesHeight, totalTiles, mainImageWidth, mainImageHeight, croppedMainImage, d, tiles;


// CLEANS THE TILES:
mongobase.clearTiles();

async.waterfall([
	function ($){
		// proposed dimensions for mosaic, based on aspect ratio and number of wanted tiles
		tilesHeight = Math.round( Math.sqrt(config.mosaic.maxtiles/(config.mosaic.aspectratio)) );
		tilesWidth = Math.round( config.mosaic.maxtiles / tilesHeight );

		console.log('width(#tiles): ' + tilesWidth);
		console.log('height(#tiles): ' + tilesHeight);
		console.log('total #tiles: ' + tilesWidth*tilesHeight);
		totalTiles = tilesWidth*tilesHeight;

		// 4 digits = %04d
		d = '%0'+(''+totalTiles).length+'d';

		// width and height the main image should be, based on the number of tiles and tile size:
		mainImageWidth = tilesWidth * config.mosaic.tile.width;
		mainImageHeight = tilesHeight * config.mosaic.tile.height;
		$()
	},

	function ($) {
		cropMainImage($);
	},

	function (image, $) {
		croppedMainImage = image;
		sliceMainImage($);
	},

	function (data, $){
		console.log(data);

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
		async.eachLimit(tiles, 100, function (tile, $for){
			mongobase.saveTile(tile, function (err, data){
				if(err) return $for(err);
				return $for();
			});
		}, $);
	}
], function (err){
	if(err) return console.log(err);
	return console.log('done');
});


function cropMainImage (callback){
	console.log('cropping main image to: ' + mainImageWidth + 'x' + mainImageHeight);
	var croppedImage = path.join(__dirname, config.mosaic.folders.root, config.mosaic.folders.main, 'main_cropped.png');
	image.crop( path.join(__dirname, config.mosaic.folders.root, config.mosaic.mainimage), mainImageWidth, mainImageHeight, croppedImage, function (err, data){
		if(!callback) return;
		if(err) return callback(err);
		return callback(null, croppedImage);
	});
}

function sliceMainImage (callback) {
	var tileFiles = path.join( config.mosaic.folders.main, 'tile_'+d+'.png' );
	var outputfiles = path.join(__dirname, config.mosaic.folders.root, tileFiles);

	console.log('slicing main image into tiles of ' + config.mosaic.tile.width + 'x' + config.mosaic.tile.height + ' into ' + outputfiles);

	image.slice( croppedMainImage, config.mosaic.tile.width, config.mosaic.tile.height, outputfiles, function (err, data){
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

	var filename = path.join(__dirname, config.mosaic.folders.root, tile);

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














