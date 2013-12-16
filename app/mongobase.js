var mongojs = require('mongojs');
var db = mongojs('kerstkaart2013', ['tiles']);


function saveTile(tile, callback){
	if(!tile.index) return callback(new Error('Tile needs and index'));

	tile._id = tile.index; // tiles are unique by index

	db.tiles.save(tile, function (err, data) {
		if(!callback) return;

		if(err) return callback(err);
		if(data == 1) return callback(null, tile);
		else return callback(null, data);
	});
}

function getTile (index, callback) {
	db.tiles.findOne({_id: index}, function (err, data){
		if(err) return callback(err);

		var tile = data;
		tile.index = data._id;
		delete tile._id;
		return callback(null, tile);
	});
}


exports.saveTile = saveTile;
exports.getTile = getTile;

