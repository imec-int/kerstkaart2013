var async = require('async');
var fs = require('fs');
var path = require('path');
var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase');


function removeFileExt (filename) {
	return path.join( path.dirname(filename), path.basename(filename, path.extname(filename)))
}

function getTilesInfo () {
	// proposed dimensions for mosaic, based on aspect ratio and number of wanted tiles
	var tilesHeigh = Math.round( Math.sqrt(config.mosaic.maxtiles/(config.mosaic.aspectratio)) );
	var tilesWide = Math.round( config.mosaic.maxtiles / tilesHeigh );

	// width and height the image should be, based on the number of tiles and tile size:
	var width = tilesWide * config.mosaic.tile.width;
	var height = tilesHeigh * config.mosaic.tile.height;

	// width and height the HQ image should be, based on the number of tiles and tile size:
	var widthHQ = tilesWide * config.mosaic.tilehq.width;
	var heightHQ = tilesHeigh * config.mosaic.tilehq.height;

	return {
		heigh   : tilesHeigh,
		wide    : tilesWide,
		total   : tilesWide * tilesHeigh,
		width   : width,
		height  : height,
		widthHQ : width,
		heightHQ: height
	};
}


function cropAndAverageColor (inputfile, outputfile, outputfilehq, callback) {
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
			// now get the average RGB color for it:
			image.getAverageRGBColor(inputfile, $);
		},

		function (rgb, $) {
			averageColor.rgb = rgb;

			// now get the average RGB color for it:
			image.getAverageHSBColor(inputfile, $);
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


function findClosestTile(tiles, maxNrOfUseOfSameTile, hsb){
	var closestTile = null;
	var smallestDifference;


	for (var i = tiles.length - 1; i >= 0; i--) {
		var tile = tiles[i];

		if( !tile.use )
			tile.use = 0;

		if(maxNrOfUseOfSameTile && (tile.use >= maxNrOfUseOfSameTile)) continue; // maximum use reached, skip this tile

		// no idea if this is a good metric:
		var diff_h = Math.abs( tile.hsb.h - hsb.h );
		var diff_s = Math.abs( tile.hsb.s - hsb.s );
		var diff_b = Math.abs( tile.hsb.b - hsb.b );
		var diff_total = diff_h + diff_s + diff_b;
		// var diff_total = diff_b;

		// console.log(tile.tile + ' h:' + tile.hsb.h + ', given h:' + hsb.h + ', difference: ' + diff_h);

		if(!closestTile || diff_total < smallestDifference){
			closestTile = tile;
			smallestDifference = diff_total;
		}
	};

	closestTile.use++;

	return {
		closestTile: closestTile,
		smallestDifference: smallestDifference
	};
}


function getXY (tileIndex, callback) {
	// body...
	mongobase.getConfig(function (err, config){
		if(err) return callback(err);

		var x = tileIndex%config.tilesWide;
		var y = (tileIndex-x)/config.tilesWide;

		return callback(null, {
			x: x,
			y: y
		});
	});
}

function cleanFolder (folder, callback) {
	fs.readdir(folder, function (err, files) {
		if(err) return callback(err);

		async.forEach(files, function (file, $) {
			if(file.match(/.gitignore/)) return $();

			fs.unlink( path.join(folder, file), $);
		}, callback);
	});
}

function wwwdfy (path) {
	var match = path.match(/public(\/.+)/);
	if(match && match[1]) return match[1];
	return path;
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

exports.getTilesInfo = getTilesInfo;
exports.removeFileExt = removeFileExt;
exports.cropAndAverageColor = cropAndAverageColor;
exports.findClosestTile = findClosestTile;
exports.getXY = getXY;
exports.cleanFolder = cleanFolder;
exports.wwwdfy = wwwdfy;
exports.sendError = sendError;



