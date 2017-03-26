var gulp = require('gulp');
var tslint = require('gulp-tslint');
var ts = require('gulp-typescript');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var karma = require('gulp-karma');
var browserSync = require('browser-sunc');
var runSequence = require('run-sequence');

var browserified = transform(function(filename) {
  var b = browserify({entries: filename, debug: true});
  return b.bundle();
});

var tsProject = ts.createProject({
  removeComments: true,
  noImplicitAny: true,
  target: 'ES3',
  module: 'commonjs',
  declarationFiles: false
});

var tsTestProject = ts.createProject({
  removeComments: true,
  noImplicitAny: true,
  targer: 'ES3',
  module: 'commonjs',
  declarationFiles: false
});

gulp.task('lint', function() {
  return gulp.src([
    './source/ts/**/**.ts', './test/**/**.test.ts'
  ]).pipe(tslint())
  .pipe(tslint.report('verbose'));
});

gulp.task('tsc', function() {
  return gulp.src('./source/ts/**/**.ts')
  .pipe(ts(tsProject))
  .js.pipe(gulp.dest('./temp/source/js'));
});

gulp.task('tsc-tests', function() {
  return gulp.src('./test/**/**.test.ts')
  .pipe(ts(tsTestProject))
  .js.pipe(gulp.dest('./temp/test/'));
});

gulp.task('bundle-js', function() {
  return gulp.src('./temp/source/js/main.js')
  .pipe(browserified)
  .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(uglify())
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest('./dist/source/js/'));
});

gulp.task('bundle-test', function() {
  return gulp.src('./temp/test/**/**.test.js')
  .pipe(browserified)
  .pipe(gulp.dest('./dist/test/'));
});

gulp.task('karma', function(cb) {
  gulp.src('./dist/test/**/**.test.js')
  .pipe(karma({
    configFile: 'karma.conf.js',
    action: 'run'
  }))
  .on('end', cb)
  .on('error', function(err) {
    // Make sure failed tests cause gulp to exit non-zero
    throw err;
  });
});

gulp.task('browser-sync', ['test'], function() {
  browserSync({
    server: {
      baseDir: "./dist"
    }
  });

  return gulp.watch([
    "./dist/source/js/**/*.js",
    "./dist/source/css/**.css",
    "./dist/test/**/**.test.js",
    "./dist/data/**/**",
    "./index.html"
  ], [browserSync.reload]);
});

gulp.task('bundle', function(cb) {
  runSequence('build', [
    'bundle-js', 'bundle-test'
  ], cb);
});

gulp.task('test', function(cb) {
  runSequence('bundle', ['karma'], cb);
});

gulp.task('default', ['lint', 'tsc', 'tsc-tests', 'bundle-js', 'bundle-test']);
