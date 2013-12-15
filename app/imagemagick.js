var im = require('imagemagick');
var fs = require('fs');

function getAverageRGBColor(file, callback){
	im.convert([
		file,
		"-colorspace" , "rgb",
		"-scale"      , "1x1",
		"-format"     , "'%[pixel:u]'",
		"info:"
	], function (err, data){
		if (err) return callback(err);
		var rgb = data.replace(/'(.+)'/, '$1');
		return callback(null, rgb);
	});
}

function getAverageHSBColor(file, callback){
	im.convert([
		file,
		"-colorspace" , "HSB",
		"-scale"      , "1x1",
		"-format"     , "'%[pixel:u]'",
		"info:"
	], function (err, data){
		if (err) return callback(err);
		var hsb = data.replace(/'(.+)'/, '$1');

		var match = hsb.match(/hsb\((.+)?\%,(.+)?\%,(.+)?\%\)/);
		var hsb = {
			string: hsb,
			h: parseFloat(match[1]),
			s: parseFloat(match[2]),
			b: parseFloat(match[3])
		}
		return callback(null, hsb);
	});
}

function createSolidImage(size, rgb, outputfile, callback){
	im.convert([
		"-size"       , size,
		"xc:"         + rgb,
		outputfile,
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});
}

function modulate(inputfile, h, b, s, outputfile, callback){
	im.convert([
		inputfile,
		"-modulate"   , b+","+s+","+h,
		outputfile
	], function (err, data){
		if (err) return callback(err);
		return callback(null, data);
	});
}


exports.getAverageRGBColor = getAverageRGBColor;
exports.getAverageHSBColor = getAverageHSBColor;
exports.createSolidImage = createSolidImage;
exports.modulate = modulate;








