
var imagemagick = require('./imagemagick');
var fs = require('fs');
var async = require('async');

// var inputfile = '../tests/out/pink.png';
var inputfile = '../tests/out/images_029.png';

var colortile = '../tests/out/pink.png';
var imagetile = '../tests/out/images_029.png';
var outputfile = '../tests/out/images_029_pinkified.png';


imagemagick.getAverageRGBColor(colortile, function (err, rgb){
	if(err) return console.log(err);

	console.log("average pink:");
	console.log(rgb);
});

// imagemagick.getAverageHSBColor(colortile, function (err, hsb_pink){
// 	if(err) return console.log(err);

// 	console.log("average pink:");
// 	console.log(hsb_pink);

// 	imagemagick.getAverageHSBColor(imagetile, function (err, hsb_tile){
// 		if(err) return console.log(err);
// 		console.log("average tile:");
// 		console.log(hsb_tile);

// 		var difference = {
// 			h: hsb_pink.h*100/hsb_tile.h,
// 			s: hsb_pink.s*100/hsb_tile.s,
// 			b: hsb_pink.b*100/hsb_tile.b
// 		}

// 		var difference = {
// 			h: 100,
// 			s: hsb_pink.s*100/hsb_tile.s,
// 			b: hsb_pink.b*100/hsb_tile.b
// 		}

// 		console.log("difference:");
// 		console.log(difference);

// 		imagemagick.modulate(imagetile, difference.h, difference.s, difference.b, outputfile, function (err, data){
// 			if(err) return console.log(err);
// 			console.log(data);

// 			imagemagick.getAverageHSBColor(outputfile, function (err, hsb_outputfile){
// 				if(err) return console.log(err);
// 				console.log("average outputfile:");
// 				console.log(hsb_outputfile);
// 			});
// 		});
// 	});
// });








// hsb(32.8817%,27.0954%,45.0446%)



// var inputfiles = [];
// for (var i = 0; i < 120; i++) {
// 	var inputfile = '../tests/out/tree_'+pad(i,3)+'.png';
// 	inputfiles.push(inputfile);
// };


// async.forEachSeries(inputfiles, function (inputfile, $){
// 	console.log(inputfile);
// 	imagemagick.getAverageRGBColor(inputfile, function (err, rgb){
// 		if(err) return $(err);

// 		imagemagick.createSolidImage("100x100", rgb, inputfile.replace(/tree_/, 'tree_solid_'), function (err, data){
// 			if(err) return $(err);
// 			$();
// 		});

// 	});
// }, function (err){
// 	if(err) return console.log(err);
// 	console.log("done");
// });




function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
