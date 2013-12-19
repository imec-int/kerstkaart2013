from functools import partial
from sys import maxint
import twitter
import sys
import time
from urllib2 import URLError
from httplib import BadStatusLine
import json

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

# Returns an instance of twitter.Twitter
twitter_api = oauth_login()

# Fetch the id of the @VlaamseTweeps/vlaamsetweeps list

list_result = twitter_api.lists.list(screen_name="VlaamseTweeps")
list_data = [user  for user in list_result if user['name'] == 'vlaamsemedia']
# print json.dumps(list_data, indent=2)
list_id = list_data[0]['id']
# print list_id

# Fetch all member of the list with id list_id
cursor=-1
list_result = twitter_api.lists.members(list_id=list_id,cursor=cursor)
#print json.dumps(list_result,indent=0)
list_members = list_result['users']

cursor = list_result['next_cursor']data-status-id
while cursor is not 0:
    print 'cursor = ', cursor
    list_result = twitter_api.lists.members(list_id=list_id,cursor=cursor)
    list_members += list_result['users']
    cursor = list_result['next_cursor']

# Extract the member ids
# print json.dumps(list_members, indent=2)
ids = [member['id'] for member in list_members]
print json.dumps(ids, indent=2)

# write to file
with open('vlaamsemedia_ids.json', 'w') as fp:
    json.dump(ids, fp, indent=2)
