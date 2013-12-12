# MiX Kerstkaart 2013

## Idee
* Gebruiker krijgt mail
* Opent app/webapp
* Wordt gevraagd om een foto te nemen (van om het even wat)
    * +wa melige tekst rond selfies en iedereen hoort er bij en zo
* Krijgt een mozaïkfoto te zien van 'een kerstboom'
* Gebruiker kan inzoomen op z'n eigen foto

## Research
* [http://www.christinabergey.com/notes_code/nc.php?topic=similar_img_mosaic](http://www.christinabergey.com/notes_code/nc.php?topic=similar_img_mosaic)

## Installing ImageMagick
* [install brew](http://brew.sh/)
* ```brew upgrade```
* ```brew update```
* ```brew install imagemagick```
* test it: eg run ```montage```

### Troubleshooting
on errors like:
```
montage: unable to read font `/usr/local/share/ghostscript/fonts/n019003l.pfb' @ error/annotate.c/RenderFreetype/1126.
montage: Postscript delegate failed `/var/tmp/magick-25673Kf7Pds8Zkps9': No such file or directory @ error/ps.c/ReadPSImage/837.
```
Install Ghostscript using ```brew install ghostscript```


## Some ImageMagick commands

### Documentation
* [more on the ImageMagick geometry parameters](http://www.imagemagick.org/script/command-line-processing.php#geometry)

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

### Project specific commands
crop tree.jpg to 1200x1000
```
convert data/tree.jpg -gravity center -extent 1200x1000 out/tree_1200x1000.png
```

chop tree_1200x1000.png into smaller images
```
convert out/tree_1200x1000.png +gravity -crop 100x100 out/tree_%03d.png
```

to test the tile command, stitch the chopped up image back together
```
montage 'out/tree_%03d.png[0-119]' -tile 12x10 -geometry +0+0 out/tree_stitched_back_together.png
```

convert the original images to tiles of 100x100
```
convert 'data/a%03d.jpg[1-120]' -resize 100x100^ -gravity center -extent 100x100 out/images_%03d.png
```

**overlay the tree tiles with the cropped images**

**still need to figure that out**

stitch the overlayed images back together
```
montage 'out/images_%03d.png[0-119]' -tile 12x10 -geometry +0+0 out/stitched_overlayed_image.png
```
