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


exports.getAverageRGBColor = getAverageRGBColor;
exports.createSolidImage = createSolidImage;