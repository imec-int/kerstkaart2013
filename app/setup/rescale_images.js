// *****************************************************************
// *** this script just rescales some images (not really needed) ***
// *****************************************************************

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var config = require('../config');
var image = require('../image');

var sourcefolder = '../../data/some_images/'
var outputfolder = '../../data/raw_bootstrap_images/'

var counter = 0; // start number of each converted image
fs.readdir(sourcefolder, function (err, files) {
	console.log(err);

	async.eachLimit(files, 10, function (file, $){
		var absoluteFile = path.join( sourcefolder, file );
		if(!file.match(/.jpg$|.png$/)) return $(); // only allow those file extensions

		var outputfile = printf('image_%05d.jpg', counter++);
		var absoluteOutputfile = path.join(outputfolder, outputfile);

		console.log(absoluteOutputfile);

		image.crop(absoluteFile, 200, 200, absoluteOutputfile, $);
	}, function (err) {
		if(err) return console.log(err);
		return console.log("> DONE");
	});
});