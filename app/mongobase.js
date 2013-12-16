var mongojs = require('mongojs');
var db = mongojs('kerstkaart2013', ['tiles', 'bootstraptiles']);


function clearTiles (callback){
	db.tiles.remove(function (err, res) {
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

function getTile (index, callback) {
	db.tiles.findOne({_id: index}, function (err, tile){
		if(err) return callback(err);

		delete tile._id; // we could leave this in
		return callback(null, tile);
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

function clearBootstrapTiles (callback){
	db.bootstraptiles.remove(function (err, res) {
		if(err) return callback(err);
		return callback(null, res);
	});
}

function getAllBoostrapTiles (callback) {
	db.bootstraptiles.find({},function (err, res) {
		if(err) return callback(err);
		return callback(null, res);
	});
}



exports.clearTiles = clearTiles;
exports.saveTile = saveTile;
exports.getTile = getTile;
exports.saveBootraptile = saveBootraptile;
exports.clearBootstrapTiles = clearBootstrapTiles;
exports.getAllBoostrapTiles = getAllBoostrapTiles;

