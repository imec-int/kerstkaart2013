var image = require('./image');
var utils = require('./utils');

image.readAllPixels('ninepixels.png', 10, 10, function (err, data) {
	if(err) return console.log(err);
	return console.log(data);
});


utils.copyFile()