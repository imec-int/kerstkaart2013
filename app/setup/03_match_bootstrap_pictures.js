// ***********************************************************************
// *** SETUP: this script goes throug all boostrap images (in the DB), ***
// ***          and finds the best fitting image for the tiles         ***
// ***********************************************************************

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var _ = require('underscore');
var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase');
var utils = require('../utils');

var ROOTDIR = path.join('../', config.mosaic.folders.root);

function run (maxUseOfSameTile, mainCallback) {
	var bootstrapTiles;

	async.waterfall([
		function ($) {
			// get all bootstrapTiles from db:
			mongobase.getAllBoostrapTiles($);
		},

		function (tiles, $) {
			bootstrapTiles = tiles;

			// get all tiles and match them up with the boostrap tiles:
			mongobase.getAllTiles(function (err, tiles) {
				if(err) return console.log(err);

				async.eachSeries(tiles, function (tile, $for) {
					// console.log(tile.main);
					var closestTile = utils.findClosestTile(bootstrapTiles, maxUseOfSameTile, tile.hsb, tile.rgb);


					// save the match to the DB:
					tile.bootstrap = {
						tile: closestTile.tile,
						tilehq: closestTile.tilehq
					};

					mongobase.updateTile(tile, function (err, res){
						if(err) return $for(err);

						return $for();
					});

				}, $);
			});
		}

	], mainCallback);
}

exports.run = run;


