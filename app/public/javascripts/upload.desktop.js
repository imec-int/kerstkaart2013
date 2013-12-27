var Upload = function (options){

	var webcamButtonEl = $("#webcambutton");
	var stream;
	var normalFileuploadButtons = $('#normalupload');
	var oldFashionedUploadButtons = $('#oldfashionupload');

	var fileuploadEl = $("#fileinput");
	var buttonEl = $('.buttons');

	var init = function (){
		console.log("Desktop upload module loaded");

		if(window.forceOldFashionUpload || !hasFileUploadApi()){
			// not checking for any webcam support here,
			// if the user doesn't have the new file upload throug ajax api,
			// then it probably doesn't have webcam support either

			normalFileuploadButtons.hide();
			$(".tryotheruploadinfo").hide();
			oldFashionedUploadButtons.show();

			checkOldFashionUploadCallback();
			return;
		}

		normalFileuploadButtons.show();
		oldFashionedUploadButtons.hide();

		if(!hasWebcam()){
			mixpanel.track("noWebcamSupport");
			// browser doesn't have webcan support, let's remove that button
			webcamButtonEl.hide();
		}

		fileuploadEl.bind('change', onFileuploadChange);
		webcamButtonEl.click(onWebcamClick);
		$('.takepicture').click(onWebcamTakePicture);
	};

	var checkOldFashionUploadCallback = function () {
		// server should have dropped a userid in the window namespace:

		if(window.userid){

			// hide the photo button:
			buttonEl.hide();
			$(".tryotheruploadinfo").hide();

			// start animation to keep the user busy:
			setTimeout(function () {
				// wait a second before we start animating,
				// as the tiles are probably not loaded yet:
				options.flyingTiles.letTheTilesFly();
			}, 1000);

			// request rendering of mosaic:
			$.post('/api/startrender', {userid: window.userid}, function (data) {
				if(data.err) return console.log(data.err);

				// done: complete the animation and show his image
				$(".userchristmascard").attr('src', data.mosaicimage); // set image first, so it can preload

				options.flyingTiles.flyThemAllAtOnce(); // fly all fake tiles in

				// show user image after tiles have been flown in:
				setTimeout(function () {
					$(".userchristmascard").addClass('visible');
					Sharing.renderButtons(data);
					$(".userchristmascard").click(function (event) {
						mixpanel.track("High Quality",{"capture":"oldFashioned", "clickedOn":"card", "device":"desktop", "userid":data.userid});
						window.location = '/highquality/' + data.userid;
					});
				}, options.flyingTiles.flyingTime);
			});

		}
	}


	var onFileuploadChange = function (event){
		// hide the photo button:
		buttonEl.hide();
		$(".tryotheruploadinfo").hide();
		mixpanel.track("fileUpload start",{"device":"desktop"});

		// start animation to keep the user busy:
		options.flyingTiles.letTheTilesFly();

		uploadImage(event.target.files[0], function (data){

			// done: complete the animation and show his image
			$(".userchristmascard").attr('src', data.mosaicimage); // set image first, so it can preload

			options.flyingTiles.flyThemAllAtOnce(); // fly all fake tiles in

			// show user image after tiles have been flown in:
			setTimeout(function () {
				$(".userchristmascard").addClass('visible');
				Sharing.renderButtons(data);
				mixpanel.track("fileUpload success",{"device":"desktop", "userid":data.userid});
				$(".userchristmascard").click(function (event) {
					// window.location = '/highquality/' + data.userid;
					mixpanel.track("High Quality",{"capture":"fileUpload", "clickedOn":"card", "device":"desktop", "userid":data.userid});
					window.open('/highquality/' + data.userid);
				});
			}, options.flyingTiles.flyingTime);
		});
	};

	var uploadImage = function(file, callback){
		console.log("uploading file");
		console.log(file);

		var xhr = new XMLHttpRequest(),
			upload = xhr.upload;

		upload.addEventListener("progress", function (ev) {
			if (ev.lengthComputable) {
				var percentage = (ev.loaded / ev.total) * 100 + "%";
				console.log(percentage);
			}
		}, false);

		upload.addEventListener("load", function (ev) {
			console.log("upload complete");
		}, false);

		upload.addEventListener("error", function (ev) {
			console.log(ev);
		}, false);

		xhr.open(
			"POST",
			"/xhrupload"
		);
		xhr.setRequestHeader("Cache-Control", "no-cache");
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.setRequestHeader("X-File-Name", file.name);

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				callback( JSON.parse(xhr.responseText) );
			}
		}

		xhr.send(file);
	};

	var onWebcamClick = function (event) {
		mixpanel.track("onWebcamClick");
		showWebcamNotification();
		navigator.myGetMedia({ video: true }, onWebcamConnect, onWebcamError);
	};

	var onWebcamConnect = function (_stream) {
		stream = _stream;

		var video = $("#video")[0];
		video.src = window.URL ? window.URL.createObjectURL(stream) : stream;
		video.play();
		mixpanel.track("onWebcamConnect");

		$(".webcamwrapper").show();
		hideWebcamNotification();
		console.log("webcam is playing");
	};

	var onWebcamError = function (err) {
		console.log(err);
	};

	var onWebcamTakePicture = function (event) {
		var video = $("#video")[0];
		var canvas = $("canvas")[0];

		var ctx = canvas.getContext('2d');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		//save canvas image as data url
		var dataURL = canvas.toDataURL();

		// close webcam
		if(stream){
			stream.stop();
			stream = null;
			video.pause();
		}
		mixpanel.track("onWebcamPicture");

		// remove webcam div:
		$(".webcamwrapper").hide();

		// remove other buttons:
		buttonEl.hide();
		$(".tryotheruploadinfo").hide();

		// start tile flying animation:
		options.flyingTiles.letTheTilesFly();

		$.post('/api/uploaddataurl', {dataURL: dataURL},function (data) {
			if(data.err) return console.log(data.err);

			// done: complete the animation and show his image
			$(".userchristmascard").attr('src', data.mosaicimage); // set image first, so it can preload

			options.flyingTiles.flyThemAllAtOnce(); // fly all fake tiles in

			// show user image after tiles have been flown in:
			setTimeout(function () {
				$(".userchristmascard").addClass('visible');
				Sharing.renderButtons(data);
				mixpanel.track("onWebcamPictureSuccess",{"device":"desktop", "userid":data.userid});
				$(".userchristmascard").click(function (event) {
					mixpanel.track("High Quality",{"capture":"webcam", "clickedOn":"card", "device":"desktop", "userid":data.userid});
					// window.location = '/highquality/' + data.userid;
					window.open('/highquality/' + data.userid);
				});
			}, options.flyingTiles.flyingTime);
		})
	};

	var showWebcamNotification = function () {
		$(".webcamNotification").show();
		if(isChrome()) $(".chromeallowebcamarrow").show();
	};

	var hideWebcamNotification = function (argument) {
		$(".webcamNotification").hide();
		if(isChrome()) $(".chromeallowebcamarrow").hide();
	};

	var hasFileUploadApi = function () {
		return !! ( window.FormData && ("upload" in ($.ajaxSettings.xhr()) ));
	};

	var hasWebcam = function () {
		navigator.myGetMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);

        return navigator.myGetMedia;
	};

	var isChrome = function () {
		return /chrom(e|ium)/.test(navigator.userAgent.toLowerCase());
	};

	return {
		init: init
	};
};

