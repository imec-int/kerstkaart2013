var fs, path, request, twitter_update_with_media;
fs = require('fs');
path = require('path');
request = require('request');


function twitter_update_with_media(auth_settings) {
  this.auth_settings = auth_settings;
  this.api_url = 'https://api.twitter.com/1.1/statuses/update_with_media.json';
};

twitter_update_with_media.prototype.post = function(status, file_path, callback) {
  var form, r;
  r = request.post(this.api_url, {
    oauth: this.auth_settings
  }, callback);
  form = r.form();
  form.append('status', status);
  return form.append('media[]', fs.createReadStream(path.normalize(file_path)));
};

var tuwm = new twitter_update_with_media({
  consumer_key: 'LwV2sfwiNQkLwvwAG5Ig',
  consumer_secret: 'G2k4abIgdlESbZva20qwQchUZdLEWKe9CllGQFRVEI',
  token: '2255057647-tW9Xdb6YVgsLXI5YlPpnlLBDP0x8wT9SD14PB2O',
  token_secret: 'pKfpMhWejF7qEZX4d70whFuOZdXIf2sza7Ml5ukL6E7ns'
});

tuwm.post('This is a test', 'twitchChannel.png', function(err, response) {
	if (err) {
		console.log(err);
	}
	console.log(response);
});