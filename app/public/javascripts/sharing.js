var Sharing = {
	renderButtons: function (data) {
		data.message = encodeURIComponent(data.message);

		$('.share').empty();
		$('.share').append(  $("#share-template").tmpl(data) );
	}
}
