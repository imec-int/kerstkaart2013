// *************************************************************************************************
// *** this script just rescales some image to 600x600 so they can be used as bootstrap pictures ***
// *************************************************************************************************

// I think it's best to convert them to jpg, as they are 600x600

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var config = require('../config');
var image = require('../image');

var sourcefolder = path.join(__dirname, config.mosaic.folders.root, '/bootstrap_orig/');
var outputfolder = path.join(__dirname, config.mosaic.folders.root, config.mosaic.folders.bootstrap);

var counter = 1873;
fs.readdir(sourcefolder, function (err, files) {
	console.log(err);

	async.eachLimit(files, 10, function (file, $){
		var absoluteFile = path.join( sourcefolder, file );
		if(!file.match(/.jpg$|.png$/)) return; // only allow those file extensions

		var outputfile = printf('image_%05d.jpg', counter++);
		var absoluteOutputfile = path.join(outputfolder, outputfile);

		console.log(absoluteOutputfile);

		// return $();

		image.crop(absoluteFile, 600, 600, absoluteOutputfile, $);
	});
});