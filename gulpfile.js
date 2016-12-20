/*eslint-env node*/

var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var clean = require('gulp-clean');
var sourcemaps = require('gulp-sourcemaps');

var build = './dist/';
var src = './src/js/componentary.js';

var distFiles = {
    minified: 'componentary.min.js',
    simple: 'componentary.js'
};


gulp.task('clean', function() {
    return gulp.src(build, {read: false})
        .pipe(clean());
});

gulp.task('minified_js', ['clean'], function() {
    return gulp.src(src)
        .pipe(sourcemaps.init())
        .pipe(concat(distFiles.minified))
        .pipe(uglify({preserveComments: 'license'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(build));
});

gulp.task('js', ['clean'], function() {
    return gulp.src(src)
        .pipe(sourcemaps.init())
        .pipe(concat(distFiles.simple))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(build));
});

gulp.task('watch', function() {
    return watch(src, ['default']);
});

gulp.task('default', ['js']);

// gulpfile.js<componentary> ends here
