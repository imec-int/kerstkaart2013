var HighQuality = function (options){


	var init = function (){
		$.post('/api/renderhq', {userid: window.userid}, function (data) {
			if(data.err) return console.log(data.err);
			mixpanel.track("High Quality Success",{"userid":window.userid});
			window.location = data.mosaicimageHQ;
		});
	};

	return {
		init: init
	};
};


$(function(){
	var highQuality = new HighQuality({});
	highQuality.init();
});
