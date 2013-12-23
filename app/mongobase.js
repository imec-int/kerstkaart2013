var mongojs = require('mongojs');
var db = mongojs('kerstkaart2013', ['tiles', 'users']);
var ObjectId = mongojs.ObjectId;

function clearTiles (callback){
	db.tiles.remove(function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		return callback(null, res);
	});
}

function saveTile (tile, callback){
	db.tiles.save(tile, function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		if(res == 1) return callback(null, tile);
		else return callback(null, res);
	});
}

function getAllTiles (callback) {
	db.tiles.find({}, function (err, res) {
		if(err) return callback(err);
		return callback(null, res);
	});
}

function getAllTilesWithTitle (callback) {
	db.tiles.find({tileflying: {$exists:true}}, function (err, res) {
		if(err) return callback(err);
		return callback(null, res);
	});
}

function saveUser (user, callback){
	db.users.save(user, function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		if(res == 1) return callback(null, user);
		else return callback(null, res);
	});
}

function updateUser (user, callback){
	db.users.update({_id: user._id}, user, function (err, res) {
		if(!callback) return;

		if(err) return callback(err);
		if(res == 1) return callback(null, user);
		else return callback(null, res);
	});
}

function getUser (userid, callback) {
	db.users.findOne({ _id: ObjectId(userid) }, function (err, user) {
		if(err) return callback(err);
		return callback(null, user);
	});
}



exports.clearTiles = clearTiles;
exports.saveTile = saveTile;
exports.getAllTiles = getAllTiles;
exports.getAllTilesWithTitle = getAllTilesWithTitle;

exports.saveUser = saveUser;
exports.getUser = getUser;
exports.updateUser = updateUser;

