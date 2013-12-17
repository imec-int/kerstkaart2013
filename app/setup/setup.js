var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var _01_setup_main_picture                      = require('./01_setup_main_picture');
var _02_populate_and_analyze_bootstrap_pictures = require('./02_populate_and_analyze_bootstrap_pictures');
var _03_match_bootstrap_pictures                = require('./03_match_bootstrap_pictures');
var _04_build_mosaic                            = require('./04_build_mosaic');
var _05_clear_usertiles                         = require('./05_clear_usertiles');


var DO_HQ_VERSION = true;
var MAX_USE_OF_SAME_PICTURE = 10; //null for unlimited
var SOME_FOLDER_WITH_BOOTSTRAP_IMAGES = '../../data/raw_bootstrap_images/';


// _04_build_mosaic.run(DO_HQ_VERSION, function (err, data) {
// 	if(err) return console.log(err);
// 	console.log(data);
// 	console.log("DONE");
// });

// return;

async.waterfall([
	function ($) {
		console.log('');
		console.log('> SETUP MAIN PICTURE');
		_01_setup_main_picture.run($);
	},

	function ($) {
		console.log('');
		console.log('> POPULATE AND ANALYZE BOOTSTRAP PICTURES');

		console.log('> reading bootstrap images from: ' + SOME_FOLDER_WITH_BOOTSTRAP_IMAGES);
		fs.readdir(SOME_FOLDER_WITH_BOOTSTRAP_IMAGES, function (err, files) {
			if(err) return $(err);

			var bootstsrapimages = [];
			for (var i = files.length - 1; i >= 0; i--) {
				if(files[i].match(/.jpg$|.png$/)){
					bootstsrapimages.push( path.join(SOME_FOLDER_WITH_BOOTSTRAP_IMAGES, files[i]) );
				}
			};

			_02_populate_and_analyze_bootstrap_pictures.run(bootstsrapimages, $);
		});
	},

	function ($) {
		console.log('');
		console.log('> MATCH BOOTSTRAP PICTURES');
		_03_match_bootstrap_pictures.run(MAX_USE_OF_SAME_PICTURE, $);
	},

	function ($) {
		console.log('');
		console.log('> BUILD MOSAIC');
		_04_build_mosaic.run(DO_HQ_VERSION, $);
	},

	function ($) {
		console.log('');
		console.log('> CLEAR USERTILES');
		_05_clear_usertiles.run($);
	}

], function (err) {
	if(err) return console.log(err);
	return console.log("> DONE, you can CTRL-C this");
});
