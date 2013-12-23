var Upload = function (options){

	var userHasNoFileUploadMsg = "Jammer, je toestel kan ons geen toegang tot je camera geven. Upgrade of probeer het op een desktop pc.";
	var fileuploadEl = $("#fileinput");
	var buttonEl = $('.buttons');

	var init = function (){
		console.log("Mobile upload module loaded");
		fileuploadEl.bind('change', onFileuploadChange);

		if(!hasFileUploadApi){
			// inform the user he has no file upload capabilities:
			mixpanel.track("noFileUploadSupport");
			alert(userHasNoFileUploadMsg);
		}
	};


	var onFileuploadChange = function (event){
		// hide the photo button(s):
		buttonEl.hide();
		mixpanel.track("fileUpload",{"device":"mobile"});
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
				mixpanel.track("fileUpload success",{"device":"mobile", "userid":data.userid});
				$(".userchristmascard").click(function (event) {
					window.location = '/highquality/' + data.userid;
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

	return {
		init: init
	};
};

