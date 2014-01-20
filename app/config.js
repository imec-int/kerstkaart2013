// initial parameters (used in setup.js):
// will be overwritten by vagrant/chef upon deploy

exports.showDebugInfo = true;
exports.showExpressDebugInfo = false;

exports.mosaic = {
	folders:{
		root       : '/public/mosaic/',
		main       : 'main/',
		tiles      : 'tiles/',
		output     : 'output/'
	},
	maxtiles: 1800,    // aim at 1800 tiles
	aspectratio: 16/10,
	tile:{
		size: 12
	},
	tilehq:{
		size: 128
	},
	flyingtile:{
		size: 256
	},
	maxuseofsametile: 2,   // make sure that there are enough tiles available
	minspacebetweensametile: 10,

	greetingcard: {
		lowres: {
			overlay : 'overlay.png',
			width: 660,  // don't forget to update these when you update the overlay image
			height: 540,
			offset : {
				x: 12,
				y: 12
			}
		},
		dontPutFakeTilesBeyond: 250 // the overlay starts from about 250px height
	}
};

exports.sharing = {
	message : 'Mijn selfie werd gemixt met het media jaaroverzicht %23iwasmixed',
	messageNoHash : 'Mijn selfie werd gemixt met het media jaaroverzicht',
	url : 'www.mixwensen.be',
	title: 'MiX je selfie met het media jaaroverzicht',
	hardcodedUrl: 'http://www.mixwensen.be'
}

// replace with your own keys for twitter and twitpic
exports.keys = {
	consumerKey: '',
	consumerSecret: '',
	token: '',
	tokenSecret: '',
	twitPic: ''
};
