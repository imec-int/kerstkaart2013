var Sharing = {
	renderButtons: function (data) {
		// data.message = encodeURIComponent(data.message);

		$('.sharewrapper').empty();
		$('.sharewrapper').append(  $("#share-template").tmpl(data) );
	}
}
