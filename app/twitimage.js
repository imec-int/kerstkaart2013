var keys = require('./config').keys;
var fs = require('fs');
var OAuthEcho = require('oauth').OAuthEcho;

var realm = "http://api.twitter.com/";
var verifyCredentials = "https://api.twitter.com/1.1/account/verify_credentials.json";
var oauth = new OAuthEcho(realm, verifyCredentials, keys.consumerKey, keys.consumerSecret, "1.0", "HMAC-SHA1", null,{ "X-Auth-Service-Provider": verifyCredentials});

function twitPicImage(imagePath, callback) {
	var media = "data:image/png;base64," + fs.readFileSync(imagePath, 'base64');
	oauth.post("http://api.twitpic.com/2/upload.json", keys.token, keys.tokenSecret, {media: media, key: keys.twitPic}, function(err, data){
		if(err) return callback(err);
		var url = "";
		try{
			url = JSON.parse(data).url;
		}catch(err){
			return callback(err);
		}
		callback(err, url);

	});
}

// example usage
// twitPicImage(require('path').join(__dirname, 'public/images/santamosaic.jpg'), function(err, url){
// 	console.log(url);
// });

exports.twitPicImage = twitPicImage;