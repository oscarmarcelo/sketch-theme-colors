import {src, dest} from 'gulp';
import postcss from 'gulp-postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import postcssNested from 'postcss-nested';
import autoprefixer from 'autoprefixer';
import {reload} from 'browser-sync';
import notify from 'gulp-notify';

import config from '../config';



/**
 * ================================
 * Compile with Tailwind.
 * Autoprefix.
 * Inject files into browser.
 * Notify end of task.
 * ================================
 */

export default () =>
  src([
    config.src.styles,
    '!**/_*'
  ])
    .pipe(postcss([
      postcssImport(),
      tailwindcss(),
      postcssNested(),
      autoprefixer()
    ]))
    .pipe(dest(config.build.styles))
    .pipe(reload({
      stream: true
    }))
    .pipe(notify({
      message: 'CSS generated!',
      onLast: true
    }));
