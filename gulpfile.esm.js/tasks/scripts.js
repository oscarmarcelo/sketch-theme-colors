import {src, dest} from 'gulp';
import notify from 'gulp-notify';

import config from '../config';



/**
 * ================================
 * Copy JavaScript.
 * Notify end of task.
 * ================================
 */

export default () =>
  src(config.src.scripts)
    .pipe(dest(config.build.scripts))
    .pipe(notify({
      message: 'JavaScript copied!',
      onLast: true
    }));
