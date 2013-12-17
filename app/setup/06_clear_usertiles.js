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

var ROOTDIR = path.join('../', config.mosaic.folders.root);


async.waterfall([
	function ($) {
		clearDB($)
	},

	function ($) {
		console.log('> database cleared');
		clearUserFolder($);
	},

	function ($) {
		console.log('> folder cleared');
		$();
	}

], function (err) {
	if(err) return console.log(err);
	return console.log('> DONE, you can CTRL-C this');
});


function clearDB (callback) {
	mongobase.getAllTilesContainingUserTiles(function (err, tiles){
		if(err) return callback(err);

		async.forEach( tiles, function (tile, $) {
			delete tile.user;

			mongobase.updateTile(tile, $);

		}, callback);
	});
}


function clearUserFolder (callback) {
	var userfolder = path.join(ROOTDIR, config.mosaic.folders.user);
	fs.readdir(userfolder, function (err, files) {
		if(err) return callback(err);

		async.forEach(files, function (file, $) {
			if(file.match(/.gitignore/)) return $();

			fs.unlink( path.join(userfolder, file), $);

		}, callback);
	});
}

