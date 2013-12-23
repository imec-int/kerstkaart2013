var Sharing = {
	renderButtons: function (data) {
		$('.share').empty();
		$('.share').append(  $("#share-template").tmpl(data) );
	}
}
