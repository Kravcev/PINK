import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import createWebp from 'gulp-webp';
import { deleteAsync } from 'del';
import getData from 'gulp-data';
import gulp from 'gulp';
import sass from 'gulp-dart-sass';
import minifyCss from 'postcss-csso';
import minifyJs from 'gulp-terser';
import optimizeImages from 'gulp-imagemin';
import optimizeJpeg from 'imagemin-mozjpeg';
import optimizePng from 'imagemin-pngquant';
import optimizeSvg from 'imagemin-svgo';
import postcss from 'gulp-postcss';
import posthtml from 'gulp-posthtml';
import rename from 'gulp-rename';
import sortMediaQueries from 'postcss-sort-media-queries';
import { stacksvg } from 'gulp-stacksvg';
import svgoConfig from './svgo.config.js';
import twig from 'gulp-twig';
import useCondition from 'gulp-if';

const isDev = process.argv.includes('--dev');

// Styles

const postcssPlugins = [sortMediaQueries(), autoprefixer()];
if (!isDev) {
  postcssPlugins.push(minifyCss());
}

export const buildStyles = () => {
  return gulp
    .src('source/sass/style.scss', { sourcemaps: isDev })
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(postcssPlugins))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}

// HTML

const buildHtml = () => {
  return gulp
    .src('source/**/*.html')
    .pipe(posthtml())
    .pipe(gulp.dest('build'));
}

// Scripts

const buildScripts = () => {
  return gulp
    .src('source/js/*.js')
    .pipe(useCondition(!isDev, minifyJs()))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('build/js'));
}

// Images

const buildImages = () => {
  return gulp
    .src(['source/img/**/*.{jpg,png,svg}', '!source/img/icon/**'])
    .pipe(
      useCondition(
        isDev,
        optimizeImages([
          optimizePng(),
          optimizeJpeg({ progressive: true, quality: 75 }),
          optimizeSvg(svgoConfig),
        ])
      )
    )
    .pipe(gulp.dest('build/img'))
    .pipe(createWebp({ quality: 75 }))
    .pipe(gulp.dest('build/img'))
}

// Sprite

const buildSprite = () => {
  return gulp
    .src('source/img/icon/**/*.svg')
    .pipe(useCondition(!isDev, optimizeImages([optimizeSvg(svgoConfig)])))
    .pipe(stacksvg({ output: 'sprite' }))
    .pipe(gulp.dest('build/img'));
}

// Copy

const copy = () => gulp.src('source/static/**').pipe(gulp.dest('build'));

// Delete

const clean = () => deleteAsync('build');

// Reload

const reload = (done) => {
  browser.reload();
  done();
}

// Server

const server = () => {
  browser.init({
    server: ["build", "source/pixelperfect"],
    cors: true,
    notify: false,
    ui: false,
  });

  gulp.watch("source/**/*.html", gulp.series(buildHtml, reload));
  gulp.watch("source/sass/**/*.scss", buildStyles);
  gulp.watch("source/js/**/*.js", buildScripts);
  gulp.watch(
    ["source/img/**/*.{jpg,png,svg}", "!source/img/icon/**"],
    gulp.series(buildImages, reload)
  );
  gulp.watch("source/img/icon/**/*.svg", gulp.series(buildSprite, reload));
  gulp.watch("source/static/**", gulp.series(copy, reload));
};

// Build

const build = gulp.series(
  clean,
  gulp.parallel(
    buildHtml,
    buildImages,
    buildScripts,
    buildSprite,
    buildStyles,
    copy
  )
);

export default isDev ? gulp.series(build, server) : build;
