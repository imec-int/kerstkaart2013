Three Python script to retrieve media pictures from Flemish media twitter accounts

First step:
```python dump_vlaamsemedia_list.py```
to download the list vlaamsemedia from the @VlaamseTweeps account. It creates the file vlaamsemedia_ids.json.
The file contains a list of all id's of the Flemish media twitter accounts. The list is found here:
https://twitter.com/VlaamseTweeps/lists/vlaamsemedia

Second step:
```python get_vlaamsemedia_media.py > media_urls.txt```
reads the file vlaamsemedia_ids.json and scrapes ```https://twitter.com/<screen-name twitter account>/media```. The found URL's are written
to stdout. Save stdout in a file with redirect.

Third step:
```python fetch_all_urls_to_disk.py```
reads all images refered by the urls in the file media_urls.txt. For each image a hash is calculated as filename and
the correct file extension is appended (.jpg or .pgn)
