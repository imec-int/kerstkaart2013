var mongojs = require('mongojs');
var db = mongojs('kerstkaart2013', ['tiles']);


function clearTiles (callback){
	db.tiles.remove(function (err, res) {
		if(err) return console.log(err);
		return console.log(res);
	})
}

function saveTile(tile, callback){
	if(tile.index === null || tile.index === undefined) return callback(new Error('Tile needs and index: ' + JSON.stringify(tile)));

	tile._id = tile.index; // tiles are unique by their index

	db.tiles.save(tile, function (err, data) {
		if(!callback) return;

		if(err) return callback(err);
		if(data == 1) return callback(null, tile);
		else return callback(null, data);
	});
}

function getTile (index, callback) {
	db.tiles.findOne({_id: index}, function (err, tile){
		if(err) return callback(err);

		delete tile._id; // we could leave this in
		return callback(null, tile);
	});
}

exports.clearTiles = clearTiles;
exports.saveTile = saveTile;
exports.getTile = getTile;

