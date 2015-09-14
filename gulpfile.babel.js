import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';
import cssmin from 'cssnano';
import del from 'del';
import deploy from 'gulp-gh-pages';
import fs from 'fs';
import gulp from 'gulp';
import htmlmin from 'gulp-minify-html';
import postcss from 'gulp-postcss';
import replace from 'gulp-replace';
import sass from 'gulp-sass';
import seq from 'gulp-sequence';
import svgmin from 'gulp-svgmin';

const dirs = {
  src: 'src',
  dest: 'dist'
};

const paths = {
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
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(gulp.dest(config.dest));
});

gulp.task('js', () => {
  let config = paths.js;

  return gulp.src(config.src)
    .pipe(gulp.dest(config.dest));
});

gulp.task('insert:map', () => {
  let config = paths.vectors;
  let svgContent = fs.readFileSync(config.dest + '/map.svg', "utf8");

  return gulp.src(dirs.src + '/index.html')
    .pipe(replace(/{{MAP_SVG}}/g, svgContent))
    .pipe(htmlmin())
    .pipe(gulp.dest(dirs.dest));
});

gulp.task('copy', ['copy:favicon']);

gulp.task('copy:favicon', () => {
  return gulp.src(dirs.src + '/public/favicon.ico')
    .pipe(gulp.dest(dirs.dest));
});
