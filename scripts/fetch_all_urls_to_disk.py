import urllib
import os
import hashlib



with open('media_urls.txt','r') as f:
    for url in f:
    	imagename = os.path.basename(url)
    	m = hashlib.md5(url).hexdigest()
    	if '.jpg' in url:
    		shortname = m  + '.jpg'
        elif '.png' in url:
            shortname = m + '.png'
        else:
        	print 'no jpg nor png'

        print shortname
        with open(shortname, 'wb') as imgfile:
        	imgfile.write(urllib.urlopen(url).read())
        	imgfile.close()