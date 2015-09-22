import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';
import concat from 'gulp-concat';
import cssmin from 'cssnano';
import del from 'del';
import deploy from 'gulp-gh-pages';
import download from 'gulp-download';
import fs from 'fs';
import gulp from 'gulp';
import htmlmin from 'gulp-minify-html';
import jscs from 'gulp-jscs';
import jshint from 'gulp-jshint';
import minimatch from 'minimatch';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import sass from 'gulp-sass';
import seq from 'gulp-sequence';
import svgmin from 'gulp-svgmin';
import uglify from 'gulp-uglify';
import unzip from 'gulp-unzip';

const dirs = {
  src: 'src',
  dest: 'dist'
};

const paths = {
  data: {
    src: `${dirs.src}/data/`,
    dest: `${dirs.dest}/public/data/`
  },
  sass: {
    src: `${dirs.src}/public/scss/map.scss`,
    dest: `${dirs.dest}/public/css/`
  },
  js: {
    src: `${dirs.src}/public/js/**/*.js`,
    dest: `${dirs.dest}/public/js/`
  },
  vectors: {
    src: `${dirs.src}/public/vectors/*.svg`,
    dest: `${dirs.dest}/public/vectors/`
  }
};

gulp.task('build', (done) => {
  seq('clean', ['svg', 'sass', 'js'], 'insert:map', 'copy', done);
});

gulp.task('deploy', ['build'], () => {
  return gulp.src(dirs.dest + '/**/*')
    .pipe(deploy());
});

gulp.task('serve', (done) => {
  seq('build', 'browserSync', done);
});

gulp.task('clean', () => {
  return del([dirs.dest]);
});

gulp.task('svg', () => {
  let config = paths.vectors;

  return gulp.src(config.src)
    .pipe(svgmin())
    .pipe(gulp.dest(config.dest));
});

gulp.task('sass', () => {
  let config = paths.sass;
  let processors = [
    autoprefixer({ browsers: ['last 2 versions'] }),
    cssmin()
  ];

  return gulp.src(config.src)
    .pipe(plumber())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.stream());
});

gulp.task('js', ['lint:js', 'js:vendor'], () => {
  let config = paths.js;

  return gulp.src(config.src)
    .pipe(uglify())
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.stream());
});

gulp.task('js:vendor', () => {
  let config = paths.js;
  let deps = [
    './node_modules/d3/d3.min.js',
    './node_modules/d3-geo-projection/d3.geo.projection.min.js',
    './node_modules/topojson/topojson.min.js'
  ];

  return gulp.src(deps)
    .pipe(concat('d3.pack.js'))
    .pipe(gulp.dest(config.dest));
});

gulp.task('lint:js', () => {
  let config = paths.js;

  return gulp.src(config.src)
    .pipe(plumber())
    .pipe(jscs())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('insert:map', () => {
  let config = paths.vectors;
  let svgContent = fs.readFileSync(config.dest + '/map.svg', 'utf8');

  return gulp.src(dirs.src + '/index.html')
    .pipe(replace(/{{MAP_SVG}}/g, svgContent))
    .pipe(htmlmin())
    .pipe(gulp.dest(dirs.dest));
});

gulp.task('copy', ['copy:data', 'copy:favicon']);

gulp.task('copy:data', () => {
  let config = paths.data;

  return gulp.src(config.src + '/*.json')
    .pipe(gulp.dest(config.dest));
});

gulp.task('copy:favicon', () => {
  return gulp.src(dirs.src + '/public/favicon.ico')
    .pipe(gulp.dest(dirs.dest));
});

gulp.task('browserSync', () => {
  browserSync.init({
    server: {
      baseDir: dirs.dest
    }
  });

  gulp.watch(paths.sass.src, ['sass']);
  gulp.watch(paths.js.src, ['js']);
});

gulp.task('download:mapdata', ['download:countrydata']);

gulp.task('download:countrydata', () => {
  let url = 'http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_admin_0_countries_lakes.zip';

  return download(url)
    .pipe(unzip({
      filter: function(file) {
        return minimatch(file.path, '**/*.{dbf,shp,shx}')
      }
    }))
    .pipe(gulp.dest(paths.data.src));
});

gulp.task('download:placedata', () => {
  let url = 'http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/ne_50m_populated_places.zip';

  return download(url)
    .pipe(unzip({
      filter: function(file) {
        return minimatch(file.path, '**/*.{dbf,shp,shx}')
      }
    }))
    .pipe(gulp.dest(paths.data.src));
});
