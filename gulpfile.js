/*eslint-env node*/

var gulp = require('gulp');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');

var build = './dist/';
var src = './src/js/components.js';


gulp.task('clean', function() {
  return gulp.src(build, {read: false})
    .pipe(clean());
});


gulp.task('js', ['clean'], function() {
  return gulp.src(src)
    .pipe(uglify({preserveComments: 'license'}))
    .pipe(gulp.dest(build));
});


gulp.task('watch', function() {
  return gulp.watch(src, ['default']);
});

gulp.task('default', ['js']);

// gulpfile.js<components> ends here
