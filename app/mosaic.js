var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase');
var utils = require('./utils');
var printf = require('printf');

var ROOTDIR = path.join('./', config.mosaic.folders.root);

function renderMosaic (userimage, doHQ, callback, callbackHQ) {
	var orientedImage, croppedUserImage, userTiles, matchedTiles, croppedUserImageHQ;

	async.waterfall([
		function ($) {
			orientImage(userimage, $)
		},

		function (_orientedImage, $) {
			orientedImage = _orientedImage;

			cropUserImage(orientedImage, $);
		},

		function (_croppedUserImage, $) {
			croppedUserImage = _croppedUserImage;

			var tempfolder = path.join( path.dirname(userimage), utils.removeFileExt(path.basename(userimage)), '/' );
			analyzeUserImage(croppedUserImage, tempfolder, $); // needs tempfolder to store temp tiles
		},

		function (_userTiles, $) {
			userTiles = _userTiles;
			// userTiles are the analyzed tiles of the user image
			// they dont need to be stored in the DB as they are different for each request (image upload)

			matchTiles(userTiles, $);
		},

		function (_matchedUserTiles, $) {
			matchedUserTiles = _matchedUserTiles;

			// now stich it:
			stitchMosaic(croppedUserImage, matchedUserTiles, 'normalfile', $)
		},

		function (mosaicimage, $) {
			callback(null, mosaicimage);

			if(!doHQ) return $(null, null);

			// begin HQ version:
			cropUserImageHQ(orientedImage, $);
		},

		function (_croppedUserImageHQ, $) {
			if(!doHQ) return $(null, null);

			croppedUserImageHQ = _croppedUserImageHQ;

			stitchMosaic(croppedUserImageHQ, matchedUserTiles, 'hqfile', $);
		},

		function (mosaicimageHQ, $) {
			if(!doHQ) return $(null, null);

			callbackHQ(null, mosaicimageHQ);

			$();
		}

	], function (err) {
		if(err) return callback(err);
		return; //callbacks have been called in the waterfall itself
	});
}

function orientImage (inputimage, callback) {
	var orientedImage = utils.removeFileExt(inputimage) + '_oriented.jpg';

	image.autoOrient(inputimage, orientedImage, function (err, imageres) {
		if(err) return callback(err);
		return callback(null, orientedImage);
	});
}

function cropUserImage (inputimage, callback) {
	var tilesinfo = utils.getTilesInfo();
	var croppedImage = utils.removeFileExt(inputimage) + '_cropped.jpg';

	console.log('> cropping userimage to ' + tilesinfo.width + 'x' + tilesinfo.height + ' ==> ' + croppedImage);

	image.crop( inputimage, tilesinfo.width, tilesinfo.height, croppedImage, function (err, data){
		if(err) return callback(err);
		return callback(null, croppedImage);
	});
}

function cropUserImageHQ (inputimage, callback) {
	var tilesinfo = utils.getTilesInfo();
	var croppedImage = utils.removeFileExt(inputimage) + '_croppedHQ.jpg';

	console.log('> HQ: cropping userimage to ' + tilesinfo.widthHQ + 'x' + tilesinfo.heightHQ + ' ==> ' + croppedImage);

	image.crop( inputimage, tilesinfo.widthHQ, tilesinfo.heightHQ, croppedImage, function (err, data){
		if(err) return callback(err);
		return callback(null, croppedImage);
	});
}

function analyzeUserImage (inputimage, tempfolder, callback) {
	var tilesinfo, tileFiles, sliceTime, analyzeTime, usertiles;

	async.waterfall([
		function ($) {
			// make tempdir first:
			fs.mkdir(tempfolder, $);
		},

		function ($) {
			// slice user image into tiles before we can analyze each tile:
			tilesinfo = utils.getTilesInfo();

			tileFiles = 'tile_%0'+(''+tilesinfo.total).length+'d.png'; // create some filename like tile_%05d.png
			tileFiles = path.join( tempfolder, tileFiles );

			console.log('> slicing user image into tiles of ' + config.mosaic.tile.width + 'x' + config.mosaic.tile.height + ' into ' + tileFiles);
			sliceTime = Date.now();
			image.slice( inputimage, config.mosaic.tile.width, config.mosaic.tile.height, tileFiles, $);
		},

		function (imageres, $) {
			console.log('> time to slice was ' + (Date.now() - sliceTime) + ' ms');
			// now we analyze each tile and store that info in an array of usertiles:
			usertiles = [];
			// recreate the filenames ImageMagick made using the tileFiles string:
			for (var i = 0; i < tilesinfo.total; i++) {
				var tileFile = printf(tileFiles, i);
				usertiles.push( {index: i, temptilefile: tileFile} );
			};

			// don't do more than 10 cuncurrent operations or we will get ImageMagick errors:
			analyzeTime = Date.now();
			async.eachLimit(usertiles, 10, function (tile, $for){
				image.getAverageHSBColor(tile.temptilefile, function (err, hsb){
					if(err) return $for(err);
					tile.hsb = hsb;
					// delete tile.temptilefile;
					$for();
				});
			}, $);
		},

		function ($) {
			console.log('> time to analyze was ' + (Date.now() - analyzeTime) + ' ms');

			$();
		}

	], function (err) {
		if(err) return callback(err);
		return callback(null, usertiles);
	});
}

function matchTiles (usertiles, callback) {
	var maxUseOfSameTile = 10;

	mongobase.getAllTiles(function (err, tiles) {
		if(err) return callback(err);

		var L = usertiles.length;
		for (var i = 0; i < L; i++) {
			var o = utils.findClosestTile(tiles, maxUseOfSameTile, usertiles[i].hsb);

			// console.log("> " + tiles[i].temptilefile + " - smallestDifference: " + o.smallestDifference);

			// save the match in the tile
			usertiles[i].normalfile = o.closestTile.tile;
			usertiles[i].hqfile = o.closestTile.tilehq;
		}

		return callback(null, usertiles);
	});
}

function stitchMosaic (mainimage, usertiles, fileParameter, callback) {
	var stitchingTime, overlayTime;

	var tilesinfo = utils.getTilesInfo();

	var basename = utils.removeFileExt(path.basename(mainimage));
	var mosaicimage = path.join(ROOTDIR, config.mosaic.folders.output, 'mosaic_'+basename+'.jpg');
	var mosaicimage_overlayed = path.join(ROOTDIR, config.mosaic.folders.output, 'mosaic_'+basename+'_overlayed.jpg');

	async.waterfall([
		function ($) {

			// sort it before we stitch it:
			usertiles = _.sortBy(usertiles, function (tile){ return tile.index; });
			// console.log(usertiles);

			var inputfiles = [];
			for (var i = 0; i < usertiles.length; i++) {
				inputfiles.push( path.join(ROOTDIR, usertiles[i][fileParameter]) ); // fileParameter can be 'normalfile' or 'hqfile'
			};

			console.log('> stitching mosaic (' + fileParameter + ')');
			stitchingTime = Date.now();
			image.stitchImages(inputfiles, tilesinfo.wide, tilesinfo.heigh, mosaicimage, $);
		},

		function (imageres, $) {
			console.log('> time to stitch was ' + (Date.now() - stitchingTime) + ' ms (' + fileParameter + ')');

			// overlay stitched image with original:
			console.log('> overlaying mosaic (' + fileParameter + ')');
			overlayTime = Date.now();
			image.overlayImages( mainimage, mosaicimage, mosaicimage_overlayed, $);
		},

		function (imageres, $) {
			console.log('> time to overlay was ' + (Date.now() - overlayTime) + ' ms (' + fileParameter + ')');

			$();
		}

	], function (err) {
		if(err) return callback(err);
		return callback(null, mosaicimage_overlayed);
	});
}


exports.renderMosaic = renderMosaic;
