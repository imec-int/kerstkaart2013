// **************************************************************************************************
// *** this script just rescales some images to 600x600 so they can be used as bootstrap pictures ***
// **************************************************************************************************

// I think it's best to convert them to jpg, as they are 600x600

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var config = require('../config');
var image = require('../image');

var ROOTDIR = path.join('../', config.mosaic.folders.root);

var sourcefolder = path.join(ROOTDIR, '/bootstrap_orig/'); // could be any place, just a source of images
var outputfolder = path.join(ROOTDIR, config.mosaic.folders.bootstrap);

var counter = 0; // start number of each converted image
fs.readdir(sourcefolder, function (err, files) {
	console.log(err);

	async.eachLimit(files, 10, function (file, $){
		var absoluteFile = path.join( sourcefolder, file );
		if(!file.match(/.jpg$|.png$/)) return $(); // only allow those file extensions

		var outputfile = printf('image_%05d.jpg', counter++);
		var absoluteOutputfile = path.join(outputfolder, outputfile);

		console.log(absoluteOutputfile);

		image.crop(absoluteFile, 600, 600, absoluteOutputfile, $);
	}, function (err) {
		if(err) return console.log(err);
		return console.log("> DONE");
	});
});