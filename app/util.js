var async = require('async');
var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase');

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


function findClosestTile(tiles, maxNrOfUseOfSameTile, hsb, rgb){
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

	console.log("> " + (closestTile.tile || closestTile.main) + " - smallestDifference: " + smallestDifference);

	closestTile.use++;

	return closestTile;
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



exports.cropAndAverageColor = cropAndAverageColor;
exports.findClosestTile = findClosestTile;
exports.getXY = getXY;



