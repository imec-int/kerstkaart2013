$(function(){
	var flyingTiles = new FlyingTiles({});
	flyingTiles.init();

	var upload = new Upload({flyingTiles: flyingTiles});
	upload.init();

	var mailid = urlParam('mail')
	if(mailid){
		var mail = decodeURI(mailid);
		console.log("mail: "+mail);
		mixpanel.identify(mail);
	}
	mixpanel.track("Page View");

	function urlParam(name){
	    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
	    if (results==null){
	       return null;
	    }
	    else{
	       return results[1] || 0;
	    }
	}
});
