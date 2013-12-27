var Upload = function (options){

	var userHasNoFileUploadMsg = "Jammer, het lijkt er op dat je toestel ons geen toegang tot je camera kan geven. Upgrade, probeer het op een ander toestel of desktop pc.";
	var fileuploadEl = $("#fileinput");
	var buttonEl = $('.buttons');

	var init = function (){
		console.log("Mobile upload module loaded");
		fileuploadEl.bind('change', onFileuploadChange);

		if( !hasFileUploadApi() || !hasFileInput() ){
			// inform the user he has no file upload capabilities:
			mixpanel.track("noFileUploadSupport");
			alert(userHasNoFileUploadMsg);
		}
	};


	var onFileuploadChange = function (event){
		// hide the photo button(s):
		buttonEl.hide();
		mixpanel.track("Mobile Cam start");
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
				mixpanel.track("Mobile Cam success",{"userid":data.userid});
				$(".userchristmascard").click(function (event) {
					mixpanel.track("High Quality",{"capture":"mobile", "clickedOn":"card", "device":"mobile", "userid":data.userid});
					// window.location = '/highquality/' + data.userid;
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

	var hasFileUploadApi = function () {
		return !! ( window.FormData && ("upload" in ($.ajaxSettings.xhr()) ));
	};

	var hasFileInput = function () {
		// from: http://viljamis.com/blog/2012/file-upload-support-on-mobile/

		// Handle devices which falsely report support
		if (navigator.userAgent.match(/(Android (1.0|1.1|1.5|1.6|2.0|2.1))|(Windows Phone (OS 7|8.0))|(XBLWP)|(ZuneWP)|(w(eb)?OSBrowser)|(webOS)|(Kindle\/(1.0|2.0|2.5|3.0))/)) {
			return false;
		}
		// Create test element
		var el = document.createElement("input");
		el.type = "file";
		return !el.disabled;
	};

	return {
		init: init
	};
};

