var App = function (options){

	var fileuploadEl = $("#files");
	var statusEl = $("#result")

	var init = function (){
		updateStatus("init");
		fileuploadEl.bind('change', onFileuploadChange);
	};

	var onFileuploadChange = function (event){
		updateStatus("uploading...");

		uploadImage(event.target.files[0], function (data){
			console.log(data);

			$("#mosaicimage").attr('src', data.mosaicimage);
		});
	};

	var uploadImage = function(file, callback){
		updateStatus("uploading file");
		console.log(file);

		var xhr = new XMLHttpRequest(),
			upload = xhr.upload;

		upload.addEventListener("progress", function (ev) {
			if (ev.lengthComputable) {
				var percentage = (ev.loaded / ev.total) * 100 + "%";
				updateStatus(percentage);
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
			"/upload"
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

	var updateStatus = function(statusString){
		console.log(statusString);
		statusEl.text(statusString);
	};

	return {
		init: init
	};
};


$(function(){
	var app = new App({});



	app.init();
});




