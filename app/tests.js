var image = require('./image');
var utils = require('./utils');
var im = require('simple-imagemagick');

console.log( utils.getTilesInfo() );


// image.getAverageHSBColor_old('./public/images/winterbg.jpg', function (err, hsb) {
// 	if(err) return console.log(err);
// 	return console.log(hsb);
// });

// image.getAverageHSBColor('./public/images/winterbg.jpg', function (err, hsb) {
// 	if(err) return console.log(err);
// 	return console.log(hsb);
// });


im.identify('./public/images/winterbg.jpg', function (err, stdout) {
	if(err) return console.log(err);
	return console.log(stdout);
});