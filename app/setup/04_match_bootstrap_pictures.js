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






function findClosestTile(hsb, rgb, callback){
	var closestTile = null;
	var smallestHueDifference;

	mongobase.getAllBoostrapTiles(function (err, bootstrapTiles) {
		if(err) return callback(err);

		for (var i = bootstrapTiles.length - 1; i >= 0; i--) {

			// just checking hue difference for now:
			var bootstrap_hsb = bootstrapTiles[i].hsb;
			var hueDifference = Math.abs( bootstrap_hsb - hsb );
			if(!closestTile || smallestHueDifference < hueDifference){
				closestTile = bootstrapTiles[i];
			}
		};

		return callback(null, closestTile);
	});
}