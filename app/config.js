// initial parameters (used in setup.js):

exports.mosaic = {
	folders:{
		root       : '/public/mosaic/',
		main       : 'main/',
		bootstrap  : 'bootstrap/',
		user       : 'user/',
		mosaic     : 'mosaic/'
	},
	mainimage: 'cute-baby-wallpaper1.jpg',
	maxtiles: 4000,    // aim at x tiles
	aspectratio: 16/9,
	tile:{
		width: 20,
		height: 20
	},
	tilehq:{
		width: 200,
		height: 200
	}
};