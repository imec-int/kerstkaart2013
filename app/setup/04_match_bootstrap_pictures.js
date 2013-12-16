// ***********************************************************************
// *** SETUP: this script goes throug all boostrap images (in the DB), ***
// ***          and finds the best fitting image for the tiles         ***
// ***********************************************************************

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase');


var ROOTDIR = path.join('../', config.mosaic.folders.root);


// let's get all tiles and match them up with the boostrap tiles:
mongobase.getAllTiles(function (err, tiles) {
	if(err) return console.log(err);

	async.eachLimit(tiles, 20, function (tile, $) {
		// console.log(tile.main);
		findClosestTile(tile.hsb, tile.rgb, function (err, closestTile) {
			if(err) return $(err);

			// save the match to the DB:
			tile.bootstrap = {
				tile: closestTile.tile,
				tilehq: closestTile.tilehq
			};

			mongobase.updateTile(tile, function (err, res){
				if(err) return $(err);

				return $();
			});
		});
	}, function (err) {
		if(err) return console.log(err);
		return console.log('> DONE, you can CTRL-C this');
	});
});

function findClosestTile(hsb, rgb, callback){
	var closestTile = null;
	var smallestDifference;

	mongobase.getAllBoostrapTiles(function (err, bootstrapTiles) {
		if(err) return callback(err);

		for (var i = bootstrapTiles.length - 1; i >= 0; i--) {
			var bootstrapTile = bootstrapTiles[i];

			// no idea if this is a good metric:
			var diff_h = Math.abs( bootstrapTile.hsb.h - hsb.h );
			var diff_s = Math.abs( bootstrapTile.hsb.s - hsb.s );
			var diff_b = Math.abs( bootstrapTile.hsb.b - hsb.b );
			var diff_total = diff_h + diff_s + diff_b;
			// var diff_total = diff_b;

			// console.log(bootstrapTile.tile + ' h:' + bootstrapTile.hsb.h + ', given h:' + hsb.h + ', difference: ' + diff_h);

			if(!closestTile || diff_total < smallestDifference){
				closestTile = bootstrapTile;
				smallestDifference = diff_total;
			}
		};

		console.log("> " + closestTile.tile + " - smallestDifference: " + smallestDifference);

		return callback(null, closestTile);
	});
}


