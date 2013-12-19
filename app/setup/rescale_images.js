// ****************************************************************************
// *** this script just rescales some images (can come in handy some times) ***
// ****************************************************************************

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var config = require('../config');
var image = require('../image');

var USE_NEW_NAME = false;
var NEW_NAME_REGEX  = '_twitterimage_%05d.jpg';
var NEW_NAME_COUNTER = 0; // start number of each converted image

var WIDTH = 256;
var HEIGHT = 256;

// var sourcefolder = '/Users/sam/Documents/lode_images/';
var sourcefolder = '/Users/sam/Dropbox/MiX/kerstkaart2013/';
var outputfolder = '../../data/raw_bootstrap_images/';



fs.readdir(sourcefolder, function (err, files) {
	if(err) return console.log(err);

	async.eachLimit(files, 10, function (file, $){

		var absoluteFile = path.join( sourcefolder, file );
		if(!file.match(/.jpg$|.png$/)) return $(); // only allow those file extensions

		var absoluteOutputfile;

		if(USE_NEW_NAME){
			var outputfile = printf(NEW_NAME_REGEX, NEW_NAME_COUNTER++);
			absoluteOutputfile = path.join(outputfolder, outputfile);
		}else{
			absoluteOutputfile =  path.join(outputfolder, file);
		}

		console.log(absoluteOutputfile);

		image.crop(absoluteFile, WIDTH, HEIGHT, absoluteOutputfile, $);
	}, function (err) {
		if(err) return console.log(err);
		return console.log("> DONE");
	});
});