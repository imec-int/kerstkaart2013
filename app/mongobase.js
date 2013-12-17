var mongojs = require('mongojs');
var db = mongojs('kerstkaart2013', ['config', 'tiles', 'bootstraptiles', 'usertiles']);


// config:

function saveConfig (config, callback) {
	// let's save our config in the first and only mongo document with _id = 0;
	config._id = 0;

	db.config.update({_id: config._id}, config, function (err, res) {
		if(err && callback) return callback(err);
		if(res && callback) return callback(null, config);

		// res == 0: config-document did not exist in db, save it first:
		db.config.save(config, function (err, res) {
			if(!callback) return;

			if(err) return callback(err);
			return callback(null, config);
		});

	});
}

function getConfig (callback) {
	db.config.findOne({_id: 0}, function (err, config){
		if(err) return callback(err);

		// return empty config if none exists:
		if(!config) config = {};

		return callback(null, config);
	});
}

// tiles:

function clearTiles (callback){
	db.tiles.remove(function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		return callback(null, res);
	});
}

function saveTile(tile, callback){
	if(tile.index === null || tile.index === undefined) return callback(new Error('Tile needs and index: ' + JSON.stringify(tile)));

	tile._id = tile.index; // tiles are unique by their index

	db.tiles.save(tile, function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		if(res == 1) return callback(null, tile);
		else return callback(null, res);
	});
}

function updateTile(tile, callback){
	db.tiles.update({_id: tile._id}, tile, function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		if(res == 1) return callback(null, tile);
		else return callback(null, res);
	});
}

function getTile (index, callback) {
	db.tiles.findOne({_id: index}, function (err, tile){
		if(err) return callback(err);

		return callback(null, tile);
	});
}

function getAllTiles (callback) {
	db.tiles.find({},function (err, res) {
		if(err) return callback(err);
		return callback(null, res);
	});
}

function getAllEmptyTiles (callback) {
	db.tiles.find({user: { $exists: false}},function (err, res) {
		if(err) return callback(err);
		return callback(null, res);
	});
}





// Boostrap tiles:

function clearBootstrapTiles (callback){
	db.bootstraptiles.remove(function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		return callback(null, res);
	});
}

function saveBootraptile (tile, callback){
	db.bootstraptiles.save(tile, function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		if(res == 1) return callback(null, tile);
		else return callback(null, res);
	});
}

function getAllBoostrapTiles (callback) {
	db.bootstraptiles.find({},function (err, res) {
		if(err) return callback(err);
		return callback(null, res);
	});
}


// User tiles:
function saveUserTile (tile, callback){
	db.usertiles.save(tile, function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		if(res == 1) return callback(null, tile);
		else return callback(null, res);
	});
}


exports.saveConfig = saveConfig;
exports.getConfig = getConfig;

exports.clearTiles = clearTiles;
exports.saveTile = saveTile;
exports.updateTile = updateTile;
exports.getTile = getTile;
exports.getAllTiles = getAllTiles;
exports.getAllEmptyTiles = getAllEmptyTiles;

exports.clearBootstrapTiles = clearBootstrapTiles;
exports.saveBootraptile = saveBootraptile;
exports.getAllBoostrapTiles = getAllBoostrapTiles;

exports.saveUserTile = saveUserTile;

