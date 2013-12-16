var im = require('imagemagick');
var fs = require('fs');

// still need to figure out what '+repage' does, but it fixes a lot of issues :p

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


function slice (inputfile, width, heigth, outputfiles, callback) {
	// convert out/tree_1200x1000.png +gravity -crop 100x100 out/tree_%03d.png

	console.log('SLICING');
	console.log(inputfile);
	console.log(width);
	console.log(heigth);

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

function getAverageRGBColor(file, callback){
	im.convert([
		file,
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

function getAverageHSBColor(file, callback){
	im.convert([
		file,
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

exports.crop = crop;
exports.slice = slice;
exports.getAverageRGBColor = getAverageRGBColor;
exports.getAverageHSBColor = getAverageHSBColor;
exports.createSolidImage = createSolidImage;
exports.modulate = modulate;








