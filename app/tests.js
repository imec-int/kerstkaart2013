var image = require('./image');
var utils = require('./utils');

console.log( utils.getTilesInfo() );


image.getAverageHSBColor_old('./public/images/winterbg.jpg', function (err, hsb) {
	if(err) return console.log(err);
	return console.log(hsb);
});

image.getAverageHSBColor('./public/images/winterbg.jpg', function (err, hsb) {
	if(err) return console.log(err);
	return console.log(hsb);
});