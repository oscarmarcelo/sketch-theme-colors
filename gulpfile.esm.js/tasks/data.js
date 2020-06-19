import {src, dest} from 'gulp';
import notify from 'gulp-notify';

import config from '../config';



/**
 * ================================
 * Copy data files.
 * Notify end of task.
 * ================================
 */

export default () =>
  src(config.src.data)
    .pipe(dest(config.build.data))
    .pipe(notify({
      message: 'Data copied!',
      onLast: true
    }));
