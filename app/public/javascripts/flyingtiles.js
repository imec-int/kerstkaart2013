var FlyingTiles = function (options){

	var cardWrapperEl = $('.cardwrapper');
	var cardEl = $('.christmascard');
	var fakeTileEls = $('.faketile');

	var flyingTileIndex = 0;
	var flyingTimeout = 300; // time between flying tiles

	var init = function (){
		console.log("Flying tiles module loaded");

		$(window).on("load resize orientationchange", onResize);
	};

	var onResize = function () {
		repositionFakeTiles();
	};

	// position some fake tiles on the example card,
	// and move them outside the card so we can move them back in later
	var repositionFakeTiles = function () {
		// when the example christmas card resizes, we will have to resize the fake tiles as well:
		var originalCard = {
			width : parseFloat( cardEl.attr('data-width') ),
			height: parseFloat( cardEl.attr('data-height') ),
			mosaicOffsetX: parseFloat( cardEl.attr('data-mosaic-offset-x') ),
			mosaicOffsetY: parseFloat( cardEl.attr('data-mosaic-offset-y') )
		};

		var scaleValue = cardEl.width() / originalCard.width;

		cardWrapperEl.height( originalCard.height * scaleValue );

		var mosaicOffsetX = originalCard.mosaicOffsetX * scaleValue;
		var mosaicOffsetY = originalCard.mosaicOffsetY * scaleValue;

		// 2 offset variables to set the tiles on the left and right under each other:
		var verticalOffsetLeft = 0;
		var verticalOffsetRight = 0;

		fakeTileEls.each( function (i, elem) {

			var originalTile = {
				left: parseFloat( $(elem).attr('data-left') ),
				top : parseFloat( $(elem).attr('data-top') ),
				size: parseFloat( $(elem).attr('data-size') ),
				maxsize: parseFloat( $(elem).attr('data-maxsize') )
			};

			// position and scale the tiles so they are still on the example mosaic:
			var left   = (originalCard.mosaicOffsetX + originalTile.left) * scaleValue;
			var top    = (originalCard.mosaicOffsetY + originalTile.top) * scaleValue;
			var size   = originalTile.size * scaleValue;

			$(elem).css({
				left   : left + 'px',
				top    : top  + 'px',
				width  : size + 'px',
				height : size + 'px',
			});

			///// stop here if the tile animation is in progress:
			if(flyingTileIndex > 0) return;


			// now we scale and reposition them outside the christmas card using css3 transforms:
			var x = -left;
			var y = -top;
			var scale = 10;

			y += 59*scaleValue; // position the tile so that it's outlined with the top of the card

			// first 4 tiles should go on the left:
			// only do this in the simple (non-fancy version of the page)
			if(window.isSimpleView && (0 <= i && i < 4)){
				x -= 100;
				y += verticalOffsetLeft;

				verticalOffsetLeft += 137;
			}

			// next 4 tiles should go on the right:
			// only do this in the simple (non-fancy version of the page)
			if(window.isSimpleView && (4 <= i && i < 8)){
				x += 747;
				y += verticalOffsetRight;

				verticalOffsetRight += 137;
			}

			// other tiles should be positioned outside the window:
			// unless we're in the fancy view, then all tiles should remain outside the view
			if( (window.isSimpleView && 8 <= i) || !window.isSimpleView){
				// also, make them as big as possible:
				scale = originalTile.maxsize/size;

				// randomly decide if they should be on the left or right side of the screen:
				var r = Math.round(Math.random());
				var onTheLeft = (r==0)?true:false;

				// now find a distance that's outside the window:
				var distanceToWindowBorder = ( $(window).width() - cardEl.width() )/2;

				// find a random horizontal position:
				var randomHorizontalPosition = Math.random() * cardEl.height();

				if(onTheLeft)
					x -= distanceToWindowBorder + size*scale;
				else
					x += distanceToWindowBorder + cardEl.width() + size*scale;
				y += randomHorizontalPosition;

			}

			// apply their position and scale:
			if(Modernizr.csstransforms3d) {
				$(elem).css({
					'-webkit-transform': 'translate3d('+x+'px,'+y+'px,0) scale3d('+scale+','+scale+',1)',
					   '-moz-transform': 'translate3d('+x+'px,'+y+'px,0) scale3d('+scale+','+scale+',1)',
							'transform': 'translate3d('+x+'px,'+y+'px,0) scale3d('+scale+','+scale+',1)',
					'display': 'block'

				});
			}
			else if(Modernizr.csstransforms) {
				$(elem).css({
					'-webkit-transform': 'translate('+x+'px,'+y+'px) scale('+scale+')',
					   '-moz-transform': 'translate('+x+'px,'+y+'px) scale('+scale+')',
							'transform': 'translate('+x+'px,'+y+'px) scale('+scale+')',
					'display': 'block'

				});
			}
			else {
				// to bad :-(
				$(elem).css({
					'display': 'none'
				});
			}


		});
	};

	/// Flying the tiles:

	var letTheTilesFly = function () {
		flyingTileIndex = 0;
		flyNextTile();
	};

	var flyNextTile = function (){
		if( flyingTileIndex >= fakeTileEls.length )
			return;

		var elem = fakeTileEls[flyingTileIndex];

		flyOneElem(elem);

		flyingTileIndex++;

		setTimeout(flyNextTile, flyingTimeout);
	};

	var flyThemAllAtOnce = function () {
		flyingTileIndex = fakeTileEls.length; // this will make the other function stop

		fakeTileEls.each( function (i, elem) {
			flyOneElem(elem);
		});
	};

	var flyOneElem = function (elem) {
		// add animate class:
		$(elem).addClass('animate');

		// move it back to its original location (which would be on the example card):
		$(elem).css({
			'-webkit-transform': '',
			   '-moz-transform': '',
					'transform': '',
			'display': 'block'

		});

		setTimeout(function () {
			$(elem).removeClass('animate');
		}, 1300); // equals time of the animate + some extra time
	};

	return {
		init: init,
		letTheTilesFly: letTheTilesFly,
		flyThemAllAtOnce: flyThemAllAtOnce,
		flyingTime: 1000
	};
};

