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
Convert 1 file:
```    
convert orig_file.jpg -resize 200x200^ -gravity center -extent 200x200 output_file.png
```
Convert all files:
```
convert 'a%03d.jpg[1-200]' -resize 200x200^ -gravity center -extent 200x200 cropped_%03d.png
```

### Stitching images together as one
```
montage 'cropped_%03d.png[0-199]' -tile 20x20 -geometry +0+0 tiles_mosaic.png
```
* **-tile 20x20** : number of images horizontally and vertically
* **-geometry +0+0** : offset of image (+10+0) creates a margin of 20px horizontally

