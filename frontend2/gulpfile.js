const gulp = require("gulp");
const ts = require("gulp-typescript");
const del = require("del");
const tslint = require("gulp-tslint");
const browserSync = require("browser-sync");
const superstatic = require( "superstatic" );
const browserify = require("browserify");
const tsify = require("tsify");
const source = require('vinyl-source-stream');
const glob = require('glob');

const webserverRoot = "dist";
const distTemplateFiles = "dist_template";
const projects = {
  world: {
    name: "world",
    inputFiles: ["*.ts"],
    outDir: "dist",
  },
  worker: {
    name: "worker",
    inputFiles: ["*.ts"],
    //outFile: "outFile",  // Defaults to test2.name
    outDir: "dist",
  },
  stats: {
    name: "stats",
    inputFiles: ["*.ts"],
    outDir: "dist",
  },
  shipyard: {
    name: "shipyard",
    inputFiles: ["*.ts"],
    outDir: "dist",
  },
  shipyard2: {
    name: "shipyard2",
    inputFiles: ["*.ts"],
    outDir: "dist",
  },

}


function compileAll() {
  Object.getOwnPropertyNames(projects).forEach((index) => {
    const project = projects[index];
    compile(project);
  });
}

function compile(project) {
  const sourceDir = "src/" + project.name + "/";
  const destDir = project.outDir + "/";
  const destFileName = (project.outFile || project.name) + ".js";
  const expandedFiles = glob.sync(sourceDir + project.inputFiles);
  console.log(expandedFiles);

  return browserify({
        basedir: '.',
        debug: true,
        entries: expandedFiles,
        cache: {},
        packageCache: {}
    })
    .plugin(tsify, {project: sourceDir + "tsconfig.json"})
    .bundle()
    .on('error', function (error) { console.error(error.toString()); })
    .pipe(source(destFileName))
    .pipe(gulp.dest(destDir));
}

function copyAll() {
  Object.getOwnPropertyNames(projects).forEach((index) => {
    const project = projects[index];
    copy(project);
  });
}

function copy(project) {
  const sourceDir = "src/" + project.name + "/";
  const destDir = project.outDir + "/";
  const copyFrom = [
    sourceDir + "**/*.html",
    sourceDir + "**/*.css",
    sourceDir + "**/*.js",
  ];
  return gulp.src(copyFrom)
    .pipe(gulp.dest(destDir)) &&
    gulp.src(distTemplateFiles + "/**/*")
    .pipe(gulp.dest(destDir));
}

function cleanAll() {
  Object.getOwnPropertyNames(projects).forEach((index) => {
    const project = projects[index];
    clean(project);
  });
}

function clean(project, cb) {
  const stagingDir = project.outDir + "/" + project.name + "_staging/";
  const destDir = project.outDir + "/";
  const files = [
    stagingDir,
    destDir + "**/*.js",
    destDir + "**/*.js.map",
    destDir + "**/*.css",
    destDir + "**/*.html",
  ]
  del(files, cb);
}

function lintAll() {
  Object.getOwnPropertyNames(projects).forEach((index) => {
    const project = projects[index];
    lint(project);
  });
}

function lint(project) {
  const sourceDir = "src/" + project.name + "/";

  const tsResult = gulp.src([sourceDir + "**/*.ts"])
    .pipe(tslint({ formatter: "prose" }))
    .pipe(tslint.report({ emitError: false }));
}

function watchAll() {
  Object.getOwnPropertyNames(projects).forEach((index) => {
    const project = projects[index];
    watch(project);
  });
}

function watch(project) {
  const sourcedir = "src/" + project.name + "/";
  const tsFiles = sourcedir + "**/*.ts";
  const staticFiles = [
    sourcedir + "**/*.html",
    sourcedir + "**/*.css",
    sourcedir + "**/*.js",
  ];

  gulp.watch(tsFiles, ["lint-" + project.name, "compile-" + project.name]);
  gulp.watch(staticFiles, ["copystatic-" + project.name]);
}

function browserAll() {
  let files = [];
  Object.getOwnPropertyNames(projects).forEach((index) => {
    const project = projects[index];
    ["/**/*.html", "/**/*.js", "/**/*.css"].forEach((file) => {
      const newPath = project.outDir + file;
      files.indexOf(newPath) === -1 ? files.push(newPath) : false;
    });
  });
  console.log(files);
  browserServe(webserverRoot, files);
}

function browser(project) {
  const files = ["/**/*.html", "/**/*.js", "/**/*.css"];
  const baseDir = project.outDir;
  browserServe(baseDir, files);
}

function browserServe(baseDir, files) {
  browserSync({
    port: 3000,
    files: files,
    injectChanges: true,
    open: false,
    //logFileChanges: false,
    //logLevel: "silent",
    //logPrefix: "game",
    notify: true,
    reloadDelay: 0,
    server: {
      baseDir: baseDir,
      middleware: superstatic({debug: false})
    }
  });
}

Object.getOwnPropertyNames(projects).forEach((index) => {
  const project = projects[index];
  console.log("Initialising " + project.name);

  const sourceDir = "src/" + project.name + "/";
  const destDir = project.outDir + "/";

  gulp.task("compile-" + project.name, () => {compile(project);});
  gulp.task("copystatic-" + project.name, () => {copy(project);});
  gulp.task("clean-" + project.name, (cb) => {clean(project, cb);});
  gulp.task("lint-" + project.name, () => {lint(project);});
  gulp.task("browser-" + project.name, () => {browser(project);});
});

gulp.task("compile", compileAll);
gulp.task("copystatic", copyAll);
gulp.task("clean", cleanAll);
gulp.task("lint", lintAll);
gulp.task("watch", ["lint", "compile", "copystatic"], watchAll);
gulp.task("browser", ["watch"], browserAll);
gulp.task("default", ["lint", "compile", "copystatic", "watch"]);
