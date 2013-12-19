import requests
from bs4 import BeautifulSoup
import json
import twitter

def oauth_login():
    # XXX: Go to http://twitter.com/apps/new to create an app and get values
    # for these credentials that you'll need to provide in place of these
    # empty string values that are defined as placeholders.
    # See https://dev.twitter.com/docs/auth/oauth for more information
    # on Twitter's OAuth implementation.

    # CONSUMER_KEY = ''
    # CONSUMER_SECRET = ''
    # OAUTH_TOKEN = ''
    # OAUTH_TOKEN_SECRET = ''

    auth = twitter.oauth.OAuth(OAUTH_TOKEN, OAUTH_TOKEN_SECRET,
                               CONSUMER_KEY, CONSUMER_SECRET)

    twitter_api = twitter.Twitter(auth=auth)
    return twitter_api

twitter_api = oauth_login()

# Reference the self.auth parameter
twitter_stream = twitter.TwitterStream(auth=twitter_api.auth)

#Return a string with values separated by kommas
def list2csv(listofvalue):
    return ",".join(map(str, listofvalue))

def chunks(l, n):
    """ Yield successive n-sized chunks from l.
    """
    for i in xrange(0, len(l), n):
        yield l[i:i+n]

def get_pic(media_url):
	try:
		r = requests.get(media_url)
	except:
		print 'Could not get ' + media_url
		exit()

	soup = BeautifulSoup(r.text)

	pics = soup.find_all('span')

	for pic in pics:
		if pic.get('data-resolved-url-small'):
			print pic['data-resolved-url-small']

def get_media(vlaamse_media_ids, twitter_api):
	ids = twitter_api.users.lookup(user_id=list2csv(vlaamse_media_ids))
	for id in ids:
		screen_name = id['screen_name']
		#print id['screen_name']
		media_url = 'https://twitter.com/'+screen_name+'/media'
		#print media_url
		get_pic(media_url)


vlaamsemedia_ids = json.loads(open('vlaamsemedia_ids.json').read())

for vlaamsemedia_ids_sub in chunks(vlaamsemedia_ids,100):
	get_media(vlaamsemedia_ids_sub, twitter_api)
