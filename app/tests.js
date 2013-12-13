
var im = require('imagemagick');
var fs = require('fs');

var inputfile = '../tests/out/pink.png';

function getAverageColor(file, callback){
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

function createSolidImage(size, rgb, outputfile){
	im.convert([
		"-size"       , size,
		"xc:"         + rgb,
		outputfile,
	], function (err, data){
		if (err) throw err;
		console.log(data);
	});
}


for (var i = 0; i < 200; i++) {
	var inputfile = '../tests/data/a' + i + '.jpg'
};

getAverageColor(inputfile, function (err, rgb){
	createSolidImage("100x100", rgb, 'test.png');
});





