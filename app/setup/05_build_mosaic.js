// ***************************************************
// *** builds the mosaic using the bootstrap tiles ***
// ***************************************************

var fs = require('fs');
var path = require('path');
var async = require('async');
var printf = require('printf');
var _ = require('underscore');
var config = require('../config');
var image = require('../image');
var mongobase = require('../mongobase');


var DO_HQ_VERSION = true;

var ROOTDIR = path.join('../', config.mosaic.folders.root);

var tilesWide, tilesHeigh, mainimage, mainimagehq, mosaicimage, mosaicimage_overlayed;
var inputfiles, inputfilesHQ;


var now = Date.now();
mosaicimage = path.join(config.mosaic.folders.mosaic, 'mosaic_'+now+'.jpg');
mosaicimage_overlayed = path.join(config.mosaic.folders.mosaic, 'mosaic_'+now+'_overlayed.jpg');

mosaicimagehq = path.join(config.mosaic.folders.mosaic, 'mosaic_'+now+'_hq.jpg');
mosaicimagehq_overlayed = path.join(config.mosaic.folders.mosaic, 'mosaic_'+now+'_hq_overlayed.jpg');

async.waterfall([
	function ($) {
		mongobase.getConfig( $ );
	},

	function (config, $) {
		tilesWide = config.tilesWide;
		tilesHeigh = config.tilesHeigh;
		mainimage = config.mainimage;
		mainimagehq = config.mainimagehq;


		// get all tiles from DB:
		mongobase.getAllTiles($);
	},

	function (tiles, $) {
		// get all tiles we need to make the mosaic:
		inputfiles = [];
		inputfilesHQ = [];

		// for some reason the tiles are not sorted by index or _id:
		// if we don't sort this, we'll get some funky mosaic
		tiles = _.sortBy(tiles, function (tile) {
			return tile.index;
		});

		for (var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];

			if(tile.user){
				inputfiles.push( path.join(ROOTDIR, tile.user.tile) );
				inputfilesHQ.push( path.join(ROOTDIR, tile.user.tilehq) );
			}else if(tile.bootstrap){
				inputfiles.push( path.join(ROOTDIR, tile.bootstrap.tile) );
				inputfilesHQ.push( path.join(ROOTDIR, tile.bootstrap.tilehq) );
			}
		};


		console.log("> stitching mosaic");
		image.stitchImages(inputfiles, tilesWide, tilesHeigh, path.join(ROOTDIR, mosaicimage), $);
	},

	function (res, $) {
		// overlay stitched image with original:
		console.log("> overlaying mosaic");
		image.overlayImages(
			path.join(ROOTDIR, mainimage),
			path.join(ROOTDIR, mosaicimage),
			path.join(ROOTDIR, mosaicimage_overlayed),
		$);
	},

	function (res, $) {
		if(!DO_HQ_VERSION) return $();

		// stitch the hq version:
		console.log("> stitching HQ mosaic");
		image.stitchImages(inputfilesHQ, tilesWide, tilesHeigh, path.join(ROOTDIR, mosaicimagehq), $);
	},

	function (res, $) {
		if(!DO_HQ_VERSION) return $();

		// overlay stitched image hq with original hq:
		console.log("> overlaying HQ mosaic");
		image.overlayImages(
			path.join(ROOTDIR, mainimagehq),
			path.join(ROOTDIR, mosaicimagehq),
			path.join(ROOTDIR, mosaicimagehq_overlayed),
		$);
	},

], function (err) {
	if(err) return console.log(err);

	return console.log('> DONE, you can CTRL-C this');
});

