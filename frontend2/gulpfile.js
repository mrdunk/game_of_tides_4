'use strict';

const gulp = require('gulp');
const debug = require('gulp-debug');
const inject = require('gulp-inject');
const ts = require('gulp-typescript');
// const tsProject = ts.createProject('./tsconfig.json');
const tslint = require('gulp-tslint');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const browserSync = require('browser-sync');
const superstatic = require( 'superstatic' );
const webserver = require('gulp-webserver');


var projects =
  {
    world:
      { tsconfig: 'src/app/world/tsconfig.json',
        ts: ['src/app/world/**/*.ts', 'src/app/common/**/*.ts'],
        html: ['src/*.html', 'src/*.css'],
        other: ['build/wrap_terrain.js'],
        dist: 'dist',
      },
    worker:
      { tsconfig: 'src/app/worker/tsconfig.json',
        ts: ['src/app/worker/**/*.ts', 'src/app/common/**/*.ts'],
        html: ['src/*.html', 'src/*.css'],
        other: [],
        dist: 'dist',
      },
    stats:
      { tsconfig: 'src/app/stats/tsconfig.json',
        ts: ['src/app/stats/**/*.ts'],
        html: ['src/*.html', 'src/*.css'],
        other: [],
        dist: 'dist',
      }
  };


/**
 * Lint all custom TypeScript files.
 */
for(const key in projects) {
  if(projects.hasOwnProperty(key)) {
    gulp.task("ts-lint--" + key, () =>
        gulp.src(projects[key].ts)
            .pipe(tslint({
                formatter: "prose"
            }))
            .pipe(tslint.report({
                emitError: false
            }))
    );
  }
}

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
for(const key in projects) {
  if(projects.hasOwnProperty(key)) {
    gulp.task('compile-ts--' + key, function () {
        var flatten = require('gulp-flatten');
        var tsProject = ts.createProject(projects[key].tsconfig);
        var tsResult = gulp.src(projects[key].ts)
          .pipe(tsProject())
          .js
          .pipe(flatten())
          .pipe(gulp.dest(projects[key].dist));
        return tsResult;
    });
  }
}

for(const key in projects) {
  if(projects.hasOwnProperty(key)) {
    gulp.task("copy-html--" + key, function () {
        let copy_paths = projects[key].html.concat(projects[key].other);
        return gulp.src(copy_paths)
            .pipe(gulp.dest(projects[key].dist));
    });
  }
}


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
                              paths.dist +'/**/*.css',
                              '!' + paths.dist + '/lib'
                           ];

  // delete the files
  del(typeScriptGenFiles, cb);
});

gulp.task('watch', function() {
for(const key in projects) {
    if(projects.hasOwnProperty(key)) {
      gulp.watch(projects[key].ts, ['ts-lint--' + key, 'compile-ts--' + key]);
      gulp.watch(projects[key].html, ['copy-html--' + key]);
    }
  }
});


const serveTasks = [];
for(const key in projects) {
  if(projects.hasOwnProperty(key)) {
    serveTasks.push('compile-ts--' + key);
    serveTasks.push('copy-html--' + key);
  }
}
serveTasks.push('watch');
gulp.task('serve', serveTasks, function() {
  process.stdout.write('Starting browserSync and superstatic...\n');
  browserSync({
    port: 3000,
    files: ['index.html', 'style.css', '**/*.js', '../build/*.js'],
    injectChanges: true,
    open: false,
    //logFileChanges: false,
    //logLevel: 'silent',
    logPrefix: 'game',
    notify: true,
    reloadDelay: 0,
    server: {
      baseDir: 'dist',
      middleware: superstatic({debug: false})
    }
  });
});

gulp.task('default', ['ts-lint', 'compile-ts', 'copy-html']);
