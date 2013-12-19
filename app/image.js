var im = require('simple-imagemagick');
var fs = require('fs');

// still need to figure out what '+repage' does, but it fixes a lot of issues :p

// orientates the image correctly
function autoOrient (inputfile, outputfile, callback) {
	im.convert([
		inputfile,
		'+repage'     ,
		'-auto-orient',
		outputfile
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
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
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});
}

function readAllPixels (inputfile, width, height, callback) {
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
	], function (err, data){
		if (err) return callback(err);

		var pixels = [];
		var dataArray = data.split(';');

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
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});
}


function slice (inputfile, width, heigth, outputfiles, callback) {
	// convert out/tree_1200x1000.png +gravity -crop 100x100 out/tree_%03d.png

	im.convert([
		inputfile,
		'+repage'     ,
		'-crop'       , width+'x'+heigth,
		outputfiles
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});
}

function getAverageRGBColor(inputfile, callback){
	im.convert([
		inputfile,
		'+repage'     ,
		'-colorspace' , 'rgb',
		'-scale'      , '1x1',
		'-format'     , '\'%[pixel:u]\'',
		'info:'
	], function (err, data){
		if (err) return callback(err);
		var rgb = data.replace(/'(.+)'/, '$1');
		// rgb(198,0,255)
		var match = rgb.match(/rgb\((.+)?,(.+)?,(.+)?\)/);
		var rgb = {
			// string: rgb,
			r: parseFloat(match[1]),
			g: parseFloat(match[2]),
			b: parseFloat(match[3])
		}
		return callback(null, rgb);
	});
}

function getAverageHSBColor(inputfile, callback){
	im.convert([
		inputfile,
		'+repage'     ,
		'-colorspace' , 'HSB',
		'-scale'      , '1x1',
		'-format'     , '\'%[pixel:u]\'',
		'info:'
	], function (err, data){
		if (err) return callback(err);
		var hsb = data.replace(/'(.+)'/, '$1');

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
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});
}

function modulate(inputfile, h, b, s, outputfile, callback){
	im.convert([
		inputfile,
		'+repage'     ,
		'-modulate'   , b+','+s+','+h,
		outputfile
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
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

	im.montage(parameters, function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});
}

function overlayImages (inputimage1, inputimage2, outputfile, callback){
	// composite -compose Multiply -gravity center img1.png img2 compose_multiply.png

	im.composite([
		'-compose'   , 'Multiply',
		'-gravity'   , 'center',
		inputimage1,
		inputimage2,
		outputfile
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});


}

exports.autoOrient = autoOrient;
exports.crop = crop;
exports.slice = slice;
exports.getAverageRGBColor = getAverageRGBColor;
exports.getAverageHSBColor = getAverageHSBColor;
exports.getAverageColor = getAverageColor;
exports.createSolidImage = createSolidImage;
exports.modulate = modulate;
exports.stitchImages = stitchImages;
exports.overlayImages = overlayImages;


exports.resize = resize;
exports.readAllPixels = readAllPixels;






