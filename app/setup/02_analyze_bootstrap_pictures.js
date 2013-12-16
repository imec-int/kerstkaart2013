// ***********************************************************
// *** SETUP: this script goes throug all boostrap images, ***
// ***              scales them, analyzes them             ***
// ***                and adds them to the DB              ***
// ***********************************************************

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase');

// CLEANS THE TILES:
console.log('> cleaning DB:')
mongobase.clearBootstrapTiles();

var sourcefolder = path.join(__dirname, config.mosaic.folders.root, config.mosaic.folders.bootstrap);

fs.readdir(sourcefolder, function (err, files) {
	if(err) return console.log(err);

	async.eachLimit(files, 10, function (file, $){
		var absoluteFile = path.join( sourcefolder, file );
		if(file.match(/tile_/)) return; // the tiles are the ones that are scaled to 20x20
		if(!file.match(/.jpg$|.png$/)) return; // only allow those file extensions

		var outputfile = 'tile_' + file; // just prepend it with 'tile_'
		var absoluteOutputfile = path.join(sourcefolder, outputfile);

		console.log(absoluteOutputfile);

		image.crop(absoluteFile, config.mosaic.tile.width, config.mosaic.tile.height, absoluteOutputfile, function (err, res){
			if(err) return $(err);

			// now get the average color for it:
			getAverageColor(absoluteOutputfile, function (err, averageColor){
				if(err) return $(err);

				var boostraptile = {
					medium: file,
					tile: outputfile,
					hsb: averageColor.hsb,
					rgb: averageColor.rgb
				};

				mongobase.saveBootraptile( boostraptile, $ );
			});
		});
	}, function (err){
		console.log("> DONE");
		if(err) return console.log(err);


	});
});


function getAverageColor(filename, callback){
	var res = {};

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
