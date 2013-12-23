var im = require('simple-imagemagick');
var fs = require('fs');
var async = require('async');

// still need to figure out what '+repage' does, but it fixes a lot of issues :p

// orientates the image correctly
function autoOrient (inputfile, outputfile, callback) {
	im.convert([
		inputfile,
		'+repage'     ,
		'-auto-orient',
		outputfile
	], function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}

function crop (inputfile, width, heigth, outputfile, callback) {
	im.convert([
		inputfile,
		'+repage'     ,
		'-resize'     , width+'x'+heigth+'^',
		'-gravity'    , 'center',
		'-crop'       , width+'x'+heigth+'+0+0',
		outputfile
	], function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}

function readAllPixels_old (inputfile, width, height, callback) {
	// build command

	// convert ninepixels.png -colorspace HSB -format "%[pixel:p{0,1}];%[pixel:p{3}]\n" info:

	var pixelArrayFormat = [];
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			pixelArrayFormat.push('%[pixel:p{' + x + ',' + y + '}]');
		};
	};

	im.convert([
		inputfile,
		'+repage'     ,
		'-colorspace' , 'HSB',
		'-format'     , pixelArrayFormat.join(';'),
		'info:'
	], function (err, stdout, stderr){
		if (err) return callback(err);

		var pixels = [];
		var dataArray = stdout.split(';');

		for (var i = 0; i < dataArray.length; i++) {
			var match = dataArray[i].match(/hsb\((.+)?\%,(.+)?\%,(.+)?\%\)/);
			pixels.push({
				// string: hsb,
				h: parseFloat(match[1]),
				s: parseFloat(match[2]),
				b: parseFloat(match[3])
			});
		};
		return callback(null, pixels);
	});
}

function readAllPixels (inputfile, width, height, callback) {
	// build command

	// convert ninepixels.png -colorspace HSB -format "%[pixel:p{0,1}];%[pixel:p{3}]\n" info:

	var pixelArrayFormat = [];
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var p = 'p{'+x+','+y+'}';
			pixelArrayFormat.push('%[fx:'+p+'.r*100];%[fx:'+p+'.g*100];%[fx:'+p+'.b*100]');
		};
	};

	im.convert([
		inputfile,
		'+repage'     ,
		'-colorspace' , 'HSB',
		'-format'     , pixelArrayFormat.join('|'),
		'info:'
	], function (err, stdout, stderr){
		if (err) return callback(err);

		var pixels = [];
		var dataArray = stdout.split('|');

		for (var i = 0; i < dataArray.length; i++) {
			var values = dataArray[i].split(';');

			pixels.push({
				h: parseFloat(values[0]),
				s: parseFloat(values[1]),
				b: parseFloat(values[2])
			});
		};
		return callback(null, pixels);
	});
}

function resize (inputfile, width, heigth, outputfile, callback) {
	// test data, value is differenceCount in mosaic.js

	// Average     1782
	// Average4
	// Average9    1714
	// Average16   1503
	// Background  3333
	// Bilinear    1700
	// Blend       1782
	// Integer     1874
	// Mesh        1782
	// Nearest     1865
	// NearestNeighbor  1865
	// Spline      1748

	// (normal) -resize 1275 (BEST)
	// -adaptive-resize 1782
	// -sample   1865

	im.convert([
		inputfile,
		'+repage' ,
		'-resize' , width+'x'+heigth,
		outputfile
	], function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}


function slice (inputfile, width, heigth, outputfiles, callback) {
	// convert out/tree_1200x1000.png +gravity -crop 100x100 out/tree_%03d.png

	im.convert([
		inputfile,
		'+repage'     ,
		'-crop'       , width+'x'+heigth,
		outputfiles
	], function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}

function getAverageHSBColor_old(inputfile, callback){
	im.convert([
		inputfile,
		'+repage'     ,
		'-colorspace' , 'HSB',
		'-scale'      , '1x1',
		'-format'     , '\'%[pixel:u]\'',
		'info:'
	], function (err, stdout, stderr){
		if (err) return callback(err);
		var hsb = stdout.replace(/'(.+)'/, '$1');

		console.log(hsb);

		var match = hsb.match(/hsb\((.+)?\%,(.+)?\%,(.+)?\%\)/);
		var hsb = {
			// string: hsb,
			h: parseFloat(match[1]),
			s: parseFloat(match[2]),
			b: parseFloat(match[3])
		}
		return callback(null, hsb);
	});
}


function getAverageHSBColor(inputfile, callback){
	im.convert([
		inputfile,
		'+repage'     ,
		'-colorspace' , 'HSB',
		'-scale'      , '1x1',
		'-format'     , '%[fx:r*100];%[fx:g*100];%[fx:b*100]',
		'info:'
	], function (err, stdout, stderr){
		if (err) return callback(err);

		var values = stdout.split(';');

		var hsb = {
			h: parseFloat(values[0]),
			s: parseFloat(values[1]),
			b: parseFloat(values[2])
		};

		return callback(null, hsb);
	});
}


function getAverageColor(inputfile, callback){
	var res = {};

	getAverageRGBColor(inputfile, function (err, rgb){
		if(err) return callback(err);
		res.rgb = rgb;

		getAverageHSBColor(inputfile, function (err, hsb){
			if(err) return callback(err);
			res.hsb = hsb;

			return callback(null, res);
		});
	});
}

function createSolidImage(size, rgb, outputfile, callback){
	im.convert([
		'+repage'     ,
		'-size'       , size,
		'xc:'         + rgb,
		outputfile,
	], function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}

function modulate(inputfile, h, b, s, outputfile, callback){
	im.convert([
		inputfile,
		'+repage'     ,
		'-modulate'   , b+','+s+','+h,
		outputfile
	], function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}

function stitchImages (inputfiles, tilesWide, tilesHeigh, outputfile, callback) {
	// montage img1.png img2.png img3.png -tile 12x10 -geometry +0+0 out/tree_stitched_back_together.png

	var parameters = [
		'-tile'      ,  tilesWide+'x'+tilesHeigh,
		'-geometry'  ,  '+0+0',
		outputfile
	];

	parameters = inputfiles.concat(parameters); // begin the parameters with the input files

	im.montage(parameters, function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}

function overlayImages (inputimage1, inputimage2, outputfile, callback){
	// composite -compose Multiply -gravity center img1.png img2 compose_multiply.png

	im.composite([
		'+repage'    ,
		'-compose'   , 'Multiply',
		'-gravity'   , 'center',
		inputimage1,
		inputimage2,
		outputfile
	], function (err, stdout, stderr){
		if (err) return callback(err);
		return callback(null, stdout);
	});
}


function addOverlay (inputfile, overlay, offsetX, offsetY, outputfile, callback) {
	async.waterfall([
		function ($) {
			// get width and height of overlay:
			im.identify(overlay, $)
		},

		function (imagedata, $) {
			// convert rose: -extent -background none 600x600-4-50\!  crop_vp_all.gif

			// put it in a larger canvas (size of the overlay):
			im.convert([
				inputfile,
				'+repage'  ,
				'-background' , 'none',
				'-extent'     , imagedata.width+'x'+imagedata.height+'-'+offsetX+'-'+offsetY+'\!',
				outputfile
			], $);
		},

		function (stdout, stderr, $) {
			// overlay it with overlay:
			im.composite([
				overlay,
				outputfile,
				outputfile
			], $);
		}

	], callback);
}

function getImageSize (inputfile, callback) {
	im.identify(overlay, function (err, data) {
		if(err) return callback(err);
		return callback(null, data);
	});
}

exports.autoOrient = autoOrient;
exports.crop = crop;
exports.slice = slice;
exports.getAverageHSBColor_old = getAverageHSBColor_old;
exports.getAverageHSBColor = getAverageHSBColor;
exports.getAverageColor = getAverageColor;
exports.createSolidImage = createSolidImage;
exports.modulate = modulate;
exports.stitchImages = stitchImages;
exports.overlayImages = overlayImages;


exports.resize = resize;
exports.readAllPixels_old = readAllPixels_old;
exports.readAllPixels = readAllPixels;

exports.addOverlay = addOverlay;
exports.getImageSize = getImageSize;






