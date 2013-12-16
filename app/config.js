// initial parameters (used in setup.js):

exports.mosaic = {
	folders:{
		root: '/public/mosaic/',
		main: 'main/',
		placeholders: 'placeholders/',
		userimage: 'userimages/'
	},
	mainimage: 'cute-baby-wallpaper1.jpg',
	maxtiles: 400, // aim at 1000 tiles, should be more in production ( 4000? )
	aspectratio: 16/9,
	tile:{
		width: 20,
		height: 20
	}
};