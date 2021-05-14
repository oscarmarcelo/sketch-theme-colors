import {series, parallel} from 'gulp';

import styles from './tasks/styles';
import scripts from './tasks/scripts';
import views from './tasks/views';
import {serve} from './tasks/browser';
import watch from './tasks/watch';



export const build = parallel(
  styles,
  scripts,
  views
);

export default series(
  build,
  parallel(
    serve,
    watch
  )
);
