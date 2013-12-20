var path = require('path');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var config = require('./config');
var image = require('./image');
var mongobase = require('./mongobase');
var utils = require('./utils');
var printf = require('printf');

var ROOTDIR = path.join(__dirname, config.mosaic.folders.root);

function renderMosaic (userimage, doHQ, callback, callbackHQ) {
	var orientedImage, croppedUserImage, userTiles, matchedTiles, croppedUserImageHQ, tempfolder;

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

			tempfolder = path.join( path.dirname(userimage), utils.removeFileExt(path.basename(userimage)), '/' );

			// TO COMPARE THE ANALYZING ALGORITHMS, USE COMMENTED CODE BELOW:

			// var differenceCount = 0;
			// analyzeUserImage(croppedUserImage, tempfolder, function (err, _userTiles) {
			// 	if(err) return $(err);

			// 	userTiles = _userTiles;

			// 	analyzeUserImage2(croppedUserImage, tempfolder, function (err, userTiles2) {
			// 		if(err) return $(err);

			// 		userTiles = _.sortBy(userTiles, function (tile){ return tile.index; });
			// 		userTiles2 = _.sortBy(userTiles2, function (tile){ return tile.index; });

			// 		// compare the hsb values:

			// 		for (var i = 0; i < userTiles.length; i++) {
			// 			var h = (userTiles[i].hsb.h - userTiles2[i].hsb.h);
			// 			var s = (userTiles[i].hsb.s - userTiles2[i].hsb.s);
			// 			var b = (userTiles[i].hsb.b - userTiles2[i].hsb.b);

			// 			// console.log("> difference: " + Math.round(h) + " " + Math.round(s) + " " + Math.round(b) );

			// 			if(Math.abs(h) > 3 || Math.abs(b) > 3 || Math.abs(s) > 3)
			// 				differenceCount++;
			// 		};

			// 		console.log("> differenceCount: " + differenceCount);

			// 		$(null, userTiles2);
			// 	});
			// });


			analyzeUserImage2(croppedUserImage, tempfolder, $);
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
			stitchMosaic(croppedUserImage, matchedUserTiles, 'normalfile', tempfolder, $);
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

			stitchMosaic(croppedUserImageHQ, matchedUserTiles, 'hqfile', tempfolder, $);
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
	var tilesinfo, tileFiles, time, analyzeTime, usertiles;

	async.waterfall([
		function ($) {
			// make tempdir first:
			time = Date.now();
			fs.mkdir(tempfolder, $);
		},

		function ($) {
			// slice user image into tiles before we can analyze each tile:
			tilesinfo = utils.getTilesInfo();

			tileFiles = 'tile_%0'+(''+tilesinfo.total).length+'d.png'; // create some filename like tile_%05d.png
			tileFiles = path.join( tempfolder, tileFiles );

			console.log('> slicing user image into tiles of ' + config.mosaic.tile.width + 'x' + config.mosaic.tile.height + ' into ' + tileFiles);
			image.slice( inputimage, config.mosaic.tile.width, config.mosaic.tile.height, tileFiles, $);
		},

		function (imageres, $) {
			// now we analyze each tile and store that info in an array of usertiles:
			usertiles = [];
			// recreate the filenames ImageMagick made using the tileFiles string:
			for (var i = 0; i < tilesinfo.total; i++) {
				var tileFile = printf(tileFiles, i);
				usertiles.push( {index: i, temptilefile: tileFile} );
			};

			// don't do more than 10 cuncurrent operations or we will get ImageMagick errors:
			console.log('> get average color for each tile');
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
			console.log('> time to analyze with technique 1 was ' + (Date.now() - time) + ' ms');

			$();
		}

	], function (err) {
		if(err) return callback(err);
		return callback(null, usertiles);
	});
}

function analyzeUserImage2 (inputimage, tempfolder, callback) {
	var time, onePixelTiles;

	var tilesinfo = utils.getTilesInfo();

	async.waterfall([
		function ($) {
			// make tempdir first:
			time = Date.now();
			fs.mkdir(tempfolder, $);
		},

		function ($) {
			// let's resize the image so that 1px = 1 tile
			onePixelImage = path.join( tempfolder, 'one_pixel_image.png' );

			console.log('> resizing to one pixel image');
			image.resize(inputimage, tilesinfo.wide, tilesinfo.heigh, onePixelImage, $);
		},

		function (imageres, $) {
			// now lets read all pixels it up

			console.log('> reading out pixel values');
			image.readAllPixels(onePixelImage, tilesinfo.wide, tilesinfo.heigh, $);
		},

		function (pixels, $) {
			onePixelTiles = [];

			for (var i = 0; i < pixels.length; i++) {
				onePixelTiles.push( {index: i, hsb: pixels[i]} );
			};

			console.log('> time to analyze with technique 2 was ' + (Date.now() - time) + ' ms');

			$();
		},

	], function (err) {
		if(err) return callback(err);
		return callback(null, onePixelTiles);
	});
}

function matchTiles (usertiles, callback) {
	mongobase.getAllTiles(function (err, tiles) {
		if(err) return callback(err);

		var L = usertiles.length;
		for (var i = 0; i < L; i++) {
			var o = findClosestTile(tiles, usertiles[i], config.mosaic.maxuseofsametile, config.mosaic.minspacebetweensametile);

			// console.log("> " + tiles[i].temptilefile + " - smallestDifference: " + o.smallestDifference);

			// save the match in the tile
			usertiles[i].normalfile = o.closestTile.tile;
			usertiles[i].hqfile = o.closestTile.tilehq;
		}

		return callback(null, usertiles);
	});
}

function stitchMosaic (mainimage, usertiles, fileParameter, tempfolder, callback) {
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

function stitchMosaic2 (mainimage, usertiles, fileParameter, tempfolder, callback) {
	// this technique copies all inputfiles to our tempfolder with sequential filenames
	// that way we can give all filenames to ImageMagick using a regex-expression instead of giving it 4000 files through the commandline interface
	// it's not faster (it's slower), but we may need it if ImageMagick starts complaining about getting a command that's to long

	var stitchingTime, overlayTime;

	var tilesinfo = utils.getTilesInfo();
	var ext = path.extname( usertiles[0][fileParameter] );
	var destinationFileString = 'tile_%0'+(''+tilesinfo.total).length+'d' + ext; // create some filename like tile_%05d.jpg

	var basename = utils.removeFileExt(path.basename(mainimage));
	var mosaicimage = path.join(ROOTDIR, config.mosaic.folders.output, 'mosaic_'+basename+'.jpg');
	var mosaicimage_overlayed = path.join(ROOTDIR, config.mosaic.folders.output, 'mosaic_'+basename+'_overlayed.jpg');

	async.waterfall([
		function ($) {
			// sort it before we stitch it:
			usertiles = _.sortBy(usertiles, function (tile){ return tile.index; });

			// first copy all inputfiles to our tempfolder with sequential filenames:
			// that way we can give all filenames to ImageMagick with regex-expression
			async.eachLimit(usertiles, 10, function (tile, $for) {
				var sourceFile = path.join(ROOTDIR, tile[fileParameter]);
				var destFile = path.join( tempfolder, printf(destinationFileString, tile.index) );

				utils.copyFile(sourceFile, destFile, $for);
			}, $);
		},

		function ($) {
			var inputfiles = path.join( tempfolder,  destinationFileString + '[0-' + (tilesinfo.total-1) + ']'); // tile_%05d.jpg[0-3999]
			inputfiles = [inputfiles]; //expects an array of files

			console.log('> stitching mosaic (' + fileParameter + ')');
			stitchingTime = Date.now();
			image.stitchImages(inputfiles, tilesinfo.wide, tilesinfo.heigh, mosaicimage, $);
		},

		function (imageres, $) {
			console.log('> time to stitch with technique 2 was ' + (Date.now() - stitchingTime) + ' ms (' + fileParameter + ')');

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



function findClosestTile(tiles, usertile, maxNrOfUseOfSameTile, minSpaceBetweenSameTile){
	var closestTile = null;
	var smallestDifference;


	for (var i = tiles.length - 1; i >= 0; i--) {
		var tile = tiles[i];

		if( !tile.use )
			tile.use = 0;

		if(tile.lastusedindex && ( Math.abs(usertile.index - tile.lastusedindex) < minSpaceBetweenSameTile) ) continue; // dont use a tile if it's recently used

		if(maxNrOfUseOfSameTile && (tile.use >= maxNrOfUseOfSameTile)) continue; // maximum use reached, skip this tile


		// no idea if this is a good metric:
		var diff_h = Math.abs( tile.hsb.h - usertile.hsb.h );
		var diff_s = Math.abs( tile.hsb.s - usertile.hsb.s );
		var diff_b = Math.abs( tile.hsb.b - usertile.hsb.b );
		var diff_total = diff_h + diff_s + diff_b;
		// var diff_total = diff_b;

		// console.log(tile.tile + ' h:' + tile.hsb.h + ', given h:' + usertile.hsb.h + ', difference: ' + diff_h);

		if(!closestTile || diff_total < smallestDifference){
			closestTile = tile;
			smallestDifference = diff_total;
		}
	};

	closestTile.lastusedindex = usertile.index;
	closestTile.use++;

	return {
		closestTile: closestTile,
		smallestDifference: smallestDifference
	};
}




exports.renderMosaic = renderMosaic;
