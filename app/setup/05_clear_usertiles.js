// *****************************************************************
// *** clears the user tiles, in BD and in the designated folder ***
// *****************************************************************

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

function run (mainCallback) {
	async.waterfall([
		function ($) {
			clearDB($)
		},

		function ($) {
			console.log('> database cleared');
			utils.cleanFolder(path.join(ROOTDIR, config.mosaic.folders.user), $);
		},

		function ($) {
			console.log('> folder cleared');
			$();
		}

	], mainCallback);
}



function clearDB (callback) {
	mongobase.getAllTilesContainingUserTiles(function (err, tiles){
		if(err) return callback(err);

		async.forEach( tiles, function (tile, $) {
			delete tile.user;

			mongobase.updateTile(tile, $);

		}, callback);
	});
}

exports.run = run;



