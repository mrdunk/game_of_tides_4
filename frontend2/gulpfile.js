'use strict';

const gulp = require('gulp');
const debug = require('gulp-debug');
const inject = require('gulp-inject');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('./tsconfig.json');
const tslint = require('gulp-tslint');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const browserSync = require('browser-sync');
const superstatic = require( 'superstatic' );
const webserver = require('gulp-webserver');

var paths = {
		ts: ['src/app/**/*.ts'],
    html: ['src/*.html'],
    other: ['node_modules/systemjs/dist/system.js'],
		dist: 'dist'
};


/**
 * Lint all custom TypeScript files.
 */
gulp.task("ts-lint", () =>
    gulp.src(paths.ts)
        .pipe(tslint({
            formatter: "prose"
        }))
        .pipe(tslint.report({
            emitError: false
        }))
);

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', function () {
    var flatten = require('gulp-flatten');
    return tsProject.src()
                    .pipe(tsProject())
                    .js
                    .pipe(flatten())
                    .pipe(gulp.dest(paths.dist));
});

gulp.task("copy-html", function () {
    let copy_paths = paths.html.concat(paths.other);
    return gulp.src(copy_paths)
        .pipe(gulp.dest(paths.dist));
});


/**
 * Remove all generated JavaScript files from TypeScript compilation.
 */
gulp.task('clean', function (cb) {
  var typeScriptGenFiles = [
															// path to all JS files auto gen'd by editor
                              paths.dist +'/**/*.js',
															// path to all sourcemap files auto gen'd by editor
                              paths.dist +'/**/*.js.map',
                              paths.dist +'/**/*.html',
                              '!' + paths.dist + '/lib'
                           ];

  // delete the files
  del(typeScriptGenFiles, cb);
});

gulp.task('watch', function() {
    gulp.watch(paths.ts, ['ts-lint', 'compile-ts']);
    gulp.watch(paths.html, ['copy-html']);
});

gulp.task('serve', ['compile-ts', 'copy-html', 'watch'], function() {
  process.stdout.write('Starting browserSync and superstatic...\n');
  browserSync({
    port: 3000,
    files: ['index.html', '**/*.js'],
    injectChanges: true,
    //logFileChanges: false,
    //logLevel: 'silent',
    logPrefix: 'game',
    notify: true,
    reloadDelay: 0,
    server: {
      baseDir: paths.dist,
      middleware: superstatic({debug: false})
    }
  });
});

gulp.task('default', ['ts-lint', 'compile-ts', 'copy-html']);
