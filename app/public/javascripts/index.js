$(function(){
	var flyingTiles = new FlyingTiles({});
	flyingTiles.init();

	var upload = new Upload({flyingTiles: flyingTiles});
	upload.init();
});
