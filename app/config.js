// initial parameters (used in setup.js):

exports.mosaic = {
	folders:{
		root: '/public/mosaic/',
		main: 'main/',
		bootstrap: 'bootstrap/',
		user: 'user/'
	},
	mainimage: 'cute-baby-wallpaper1.jpg',
	maxtiles: 400, // aim at 400 tiles, should be more in production ( 4000? )
	aspectratio: 16/9,
	tile:{
		width: 20,
		height: 20
	}
};