# Interactive SVG Map
This project demonstrates how to create an interactive map using SVG as the map source.

## Goals
The goals of this project are:

* Generate an optimized SVG file for a global map of all countries as individual paths
* Be able to interact directly with each individual country on the map
* Be able to interact indirectly with each individual country on the map via interactions with user interface elements that are not a part of the map

## Dependencies
* Babel
* Gulp
* gulp-svgmin
* gulp-sass
* gulp-sequence
* ogr2ogr
* Topojson

## How to build the map SVG
I'm shooting for this to be as automated as possible (maybe a `make` file?), but that's not quite ready. In the meantime, here are the steps to generate the map data.

### 1. Get the Geo Data
Our map will be built from geo (map) data. d3.js doesn't include any geo data, so we need to get the geo data from some other source. We will be using map data provided by [Natural Earth](http://www.naturalearthdata.com/ "Natural Earth data"). Natural Earth provides 3 types of data scales: 1:10m, 1:50m, 1:110m. 1:10m has the most detail, so it's the largest file size. We want our map project to be as lean as possible, because we're supporting mobile devices, and we want to be as considerate of data speeds and data costs. That said, we're going to optimize the hell out of the data in some later steps, so we'll go ahead and choose the 1:10m scale data set.

> If you need to support state and province detail for every country, you will have to use the 1:10m scale, since the 1:50m and 1:110m scales only support states and provinces for US and Canada.

We're going to download the following file:

|Scale|File|
|:----|:---|
|1:10m Cultural Vectors|[Download countries without boundary lakes](http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_0_countries_lakes.zip)|


### 2. Shapefile
Once you've downloaded and unzipped the file, you'll see a bunch of files inside the folder. We're primarily concerned with the *shapefile*, the file with the `.shp` file extension. In order to use the shapefile data, we need to convert it to JSON. In order to convert the shapefile to JSON, we will first transform the shapefile to GeoJSON, and then convert the GeoJSON to JSON. Our goal is to reduce the shapefile data as much as possible, while maintaining a topological quality suitable for the web.

#### Install GDAL
In order to convert the *shapefile* data into GeoJSON, we are going to use the `ogr2ogr` command line tool that comes with the [GDAL - Geospatial Data Abstraction Library](http://www.gdal.org/) library. If you are a MacOS user, you can install gdal with [Homebrew](http://brew.sh/):

```bash
> brew install gdal
```

> Don't worry if you are not a MacOS user. Binaries for various operating systems are available for download from the [GDAL trac project wiki page](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries "GDAL binary downloads").

#### Install Topojson
We will also need another CLI tool, `topojson`, which is used to convert GeoJSON to Topojson. Since the Topojson CLI requires [node.js](https://nodejs.org/en/download/ "Node.js downloads"), make sure you have node.js installed first. Then use the command line to install Topojson:

```bash
> npm install -g topojson
```

### 3. Converting Files
We need to convert the downloaded *shapefile* to GeoJSON. Using the commmand line, navigate to the `ne_10m_admin_0_countries_lakes` folder (the folder created when you extracted the downloaded .zip file from Natural Earth) and run the following from the command line:

```bash
> ogr2ogr -f GeoJSON countries-geo.json ne_10m_admin_0_countries_lakes.shp
```

This will create a file called `countries-geo.json` from the shapefile. If you open the `countries-geo.json` file, you will see lots of numbers with property names like `ADMIN`, `SU_A3`, `NAME`, etc.

#### Excluding Antarctica
I'm sure Antarctica is a great place, but we don't need to show it on our map. So, we're going to exlcude Antarctica from our map data. Fortunately, in `ogr2ogr`, you can pass SQL-like arguments to `ogr2ogr` for querying certain features.

The `ogr2ogr` command line tool doesn't like overwriting existing files, so first delete the existing `countries-geo.json` file you just created. then run the following command to exclude Antarctica from the resulting JSON data:

```bash
> ogr2ogr -f GeoJSON -where "SU_A3 <> 'ATA'" countries-geo.json ne_10m_admin_0_countries_lakes.shp
```

#### Select attributes
The GeoJSON file is so large primarily because of the huge number of attributes assigned to each item in the dataset. We don't need all of those attributes in our JSON because we're not going to use them. So, when we convert the GeoJSON data to JSON, we're going to reduce those attributes down to only those that we're going to use, `SU_A3` and `NAME`:

```bash
> topojson --id-property su_a3 --properties name -o countries-topo.json countries-geo.json
```

In case you're wondering, the `--properties` selects the `name` attribute for inclusion in the output file.

Hmm. At somewhere around 2.5MB, our resulting JSON file is still fairly large. That's too large for use on the web, so we need to further reduce the file size.

### 4. Simplify our files
When we converted our GeoJSON to topojson, we got rid of a lot of the attributes that make the GeoJSON file so large. But, our resulting JSON file still has a lot of vertices. If we could reduce some of the vertices from each country, without compromising the topological quality, we might get to a reasonable file size.

#### Use `ogr2ogr` -simplify
The `ogr2ogr` CLI has an option `-simplify`. When this argument is passed in, polygons are smoothed, which significantly reduces the output file size. Let's try it:

```bash
# remember to first delete the existing countries-geo.json file
> ogr2ogr -f GeoJSON -simplify 0.2 -where "SU_A3 <> 'ATA'" countries-geo.json ne_10m_admin_0_countries_lakes.shp
```

then:

```bash
> topojson --id-property su_a3 --properties name -o countries-topo.json countries-geo.json
```

By doing this, we have significantly reduced our file size! But, if you look at the polygon data, you will see that country boundaries don't exactly meet up correctly. The lines should be aligned between countries, but they're not because our tools did not correctly preserve our layer topology.

#### mapshaper.org
There is a tool, [mapshaper.org](http://www.mapshaper.org/ "mapshaper website"), that supports shapefile, GeoJSON and Topojson formats. Mapshaper preserves layer topology. We could upload our shapefile to mapshaper.org, simplify it, then export it as Topojson. But, we'd lose our attributes because mapshaper doesn't preserve attributes, and we need to preserve the attributes on the data.

So, here's what we're going to do:

1. Convert our shapefile to GeoJSON with `ogr2ogr` (we won't use the `-simplify` flag).
2. Upload our GeoJSON to mapshaper and simplify online
  1. Douglas / No shape removal / 15%
3. Export our simplified data as GeoJSON.
4. Convert the exported, simplified GeoJSON to Topojson with `topojson`

Ah, that's better. We reduced the file size down to around 98K, and we preserved enough of our layer topology.

## How to build the project
From the console:

```bash
> npm run build
```

Or, if you want to start a small server that refreshes when your source files are changed, you can run:

```bash
> npm run serve
```

## Development
[TODO:]
