
var imagemagick = require('./imagemagick');
var fs = require('fs');
var async = require('async');

var inputfile = '../tests/out/pink.png';



var inputfiles = [];
for (var i = 0; i < 120; i++) {
	var inputfile = '../tests/out/tree_'+pad(i,3)+'.png';
	inputfiles.push(inputfile);
};


async.forEachSeries(inputfiles, function (inputfile, $){
	console.log(inputfile);
	imagemagick.getAverageRGBColor(inputfile, function (err, rgb){
		if(err) return $(err);

		imagemagick.createSolidImage("100x100", rgb, inputfile.replace(/tree_/, 'tree_solid_'), function (err, data){
			if(err) return $(err);
			$();
		});

	});
}, function (err){
	if(err) return console.log(err);
	console.log("done");
});




function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
