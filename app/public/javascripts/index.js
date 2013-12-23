$(function(){
	var flyingTiles = new FlyingTiles({});
	flyingTiles.init();

	var upload = new Upload({flyingTiles: flyingTiles});
	upload.init();

	// TODO: mixpanel.identify("some email address");
	mixpanel.track("Page View");
});
