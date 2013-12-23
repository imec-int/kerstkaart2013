var async = require('async');
var fs = require('fs');
var path = require('path');
var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase');


function removeFileExt (filename) {
	return path.join( path.dirname(filename), path.basename(filename, path.extname(filename)))
}

function getTilesInfo () {
	// proposed dimensions for mosaic, based on aspect ratio and number of wanted tiles
	var tilesHeigh = Math.round( Math.sqrt(config.mosaic.maxtiles/(config.mosaic.aspectratio)) );
	var tilesWide = Math.round( config.mosaic.maxtiles / tilesHeigh );

	// width and height the image should be, based on the number of tiles and tile size:
	var width = tilesWide * config.mosaic.tile.size;
	var height = tilesHeigh * config.mosaic.tile.size;

	// width and height the HQ image should be, based on the number of tiles and hq tile size:
	var widthHQ = tilesWide * config.mosaic.tilehq.size;
	var heightHQ = tilesHeigh * config.mosaic.tilehq.size;

	return {
		heigh   : tilesHeigh,
		wide    : tilesWide,
		total   : tilesWide * tilesHeigh,
		width   : width,
		height  : height,
		widthHQ : widthHQ,
		heightHQ: heightHQ
	};
}

function getTilePosition (tileIndex) {
	var tilesinfo = getTilesInfo();
	var x = tileIndex%tilesinfo.wide;
	var y = (tileIndex-x)/tilesinfo.wide;

	var x_px = x * config.mosaic.tile.size;
	var y_px = y * config.mosaic.tile.size;

	return {
		x: x,
		y: y,
		x_px: x_px,
		y_px: y_px
	}
}

function cleanFolder (folder, callback) {
	fs.readdir(folder, function (err, files) {
		if(err) return callback(err);

		async.forEach(files, function (file, $) {
			if(file.match(/.gitignore/)) return $();

			fs.unlink( path.join(folder, file), $);
		}, callback);
	});
}

/**
 * just removes overything from the path up to ... public/ so it can be accessed by the browser
 */
function wwwdfy (path) {
	var match = path.match(/public(\/.+)/);
	if(match && match[1]) return match[1];
	return path;
}

/**
 * Handy function to send errors back to the browser and display them at the same time in the console
 */
function sendError(err, webresponse){
	var o = {
		err: err.toString()
	};
	console.log(err);

	if(err.stack){
		console.log(err.stack);
		o.errstack = err.stack;
	}

	webresponse.json(o);
}

function copyFile(source, target, cb) {
	var cbCalled = false;

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}

	var rd = fs.createReadStream(source);
	rd.on("error", function (err) {
		console.log(err);
		done(err);
	});

	var wr = fs.createWriteStream(target);
	wr.on("error", function (err) {
		console.log(err);
		done(err);
	});

	wr.on("close", function (ex) {
		done();
	});

	rd.pipe(wr);
}

var cleanName = function(name) {
	name = name.toLowerCase();
    name = name.replace(/\s+/gi, '_'); // Replace white space with _
    return name.replace(/[^a-zA-Z0-9\_]/gi, ''); // Strip any special charactere
}

exports.getTilesInfo = getTilesInfo;
exports.removeFileExt = removeFileExt;

exports.getTilePosition = getTilePosition;
exports.cleanFolder = cleanFolder;
exports.wwwdfy = wwwdfy;
exports.sendError = sendError;
exports.copyFile = copyFile;
exports.cleanName = cleanName;



