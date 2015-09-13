import autoprefixer from 'autoprefixer';
import cssmin from 'cssnano';
import del from 'del';
import gulp from 'gulp';
import postcss from 'gulp-postcss';
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
    src: `${dirs.src}/public/vectors/**/*.svg`,
    dest: `${dirs.dest}/public/vectors/`
  }
};

gulp.task('build', ['svg', 'sass', 'js']);

gulp.task('serve', (done) => {
  seq('clean', 'build', 'browserSync', done);
});

gulp.task('clean', (done) => {
  del(dirs.dest, done);
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
