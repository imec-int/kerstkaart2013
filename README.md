# MiX Kerstkaart 2013

Make sure you have ImageMagick, node.js and MongoDB installed.

## Installing ImageMagick
* [install brew](http://brew.sh/)
* ```brew upgrade```
* ```brew update```
* ```brew install imagemagick```
* test it: eg run ```convert``` or run ```montage```

### Troubleshooting
on errors like:
```
montage: unable to read font `/usr/local/share/ghostscript/fonts/n019003l.pfb' @ error/annotate.c/RenderFreetype/1126.
montage: Postscript delegate failed `/var/tmp/magick-25673Kf7Pds8Zkps9': No such file or directory @ error/ps.c/ReadPSImage/837.
```
Install Ghostscript using ```brew install ghostscript```

## How to run the app and its startup script(s)

### Pre-process the tiles you will use in the mosaic

The pictures under ```raw_images/``` are used to populate the database with tiles.

Edit ```app/config.js``` 'till you're happy.

Make sure you're running [MongoDB](http://www.mongodb.org/downloads)

Run ```app/setup.js```. This will scale and analyze the pictures you selected and store their info in the database.

All files generated are stored under ```app/public/mosaic``` as described in the ```config.js``` file.

### Run the web application

Run ```node app.js``` from the ```app/``` folder to start the web server.

Go to ```http://localhost:3000/``` and upload a picture.

### Extra

If you change the ```tile``` or the ```tilehq``` parameter in ```config.js```, you will need to run ```setup.js``` again. 

## Idee
* Gebruiker krijgt mail
* Opent app/webapp
* Wordt gevraagd om een foto te nemen (van om het even wat)
    * +wa melige tekst rond selfies en iedereen hoort er bij en zo
* Krijgt een mozaïkfoto te zien van 'een kerstboom'
* Gebruiker kan inzoomen op z'n eigen foto

## Research
* [http://www.christinabergey.com/notes_code/nc.php?topic=similar_img_mosaic](http://www.christinabergey.com/notes_code/nc.php?topic=similar_img_mosaic)
* [http://www.designamosaic.com/photo-mosaic-process](http://www.designamosaic.com/photo-mosaic-process)
* [video about HUE vs RGB](http://www.youtube.com/watch?v=wp-fZ-2aUWo)





## Some ImageMagick commands

### Documentation
* [more on the ImageMagick geometry parameters](http://www.imagemagick.org/script/command-line-processing.php#geometry)
* [modulate the HSB values](http://www.imagemagick.org/Usage/color_mods/#modulate)

### Cropping images
crop 1 file
```    
convert orig_file.jpg -resize 200x200^ -gravity center -extent 200x200 output_file.png
```
crop all files
```
convert 'a_%03d.jpg[1-200]' -resize 200x200^ -gravity center -extent 200x200 cropped_%03d.png
```

### Stitching images together as one
```
montage 'cropped_%03d.png[0-199]' -tile 20x20 -geometry +0+0 tiles_mosaic.png
```
* **-tile 20x20** : number of images horizontally and vertically
* **-geometry +0+0** : offset of image (+10+0) creates a margin of 20px horizontally

### Filling an image with a specific color
```
convert images_005.png -fill 'rgb(198,0,255)' -tint 100 images_005_red.png
```

### Project specific commands
crop tree.jpg to 1200x1000
```
convert data/tree.jpg -resize 1200x1000^ -gravity center -crop 1200x1000+0+0 out/tree_1200x1000.png
```

slice tree_1200x1000.png into smaller images
```
convert +repage out/tree_1200x1000.png +gravity -crop 100x100 out/tree_%03d.png
```

to test the tile command, stitch the chopped up image back together
```
montage 'out/tree_%03d.png[0-119]' -tile 12x10 -geometry +0+0 out/tree_stitched_back_together.png
```

convert the original images to tiles of 100x100
```
convert 'data/a%03d.jpg[1-120]' -resize 100x100^ -gravity center -extent 100x100 out/images_%03d.png
```

find the average HSB color of an image:
```
convert out/pink.png -colorspace HSB -scale 1x1 -format "%[fx:360*r] graden, %[fx:100*g]%%, %[fx:100*b]%%\n" info:
```

multiply one image with another
```
composite -compose Multiply -gravity center img1.png img2 compose_multiply.png
```

stitch the overlayed images back together
```
montage 'out/images_%03d.png[0-119]' -tile 12x10 -geometry +0+0 out/stitched_overlayed_image.png
```

composite images
```
composite -geometry +60+105 testmosaic.jpg underlay.png test.png
```

```
composite overlay.png test.png test.png
```
