import {watch, series} from 'gulp';

import styles from './styles';
import scripts from './scripts';
import views from './views';
import {reload} from './browser';

import config from '../config';



/**
 * ================================
 * Watch files.
 * ================================
 */

export default done => {
  // When styles update, compile Sass files.
  watch(config.src.styles, styles);

  // When scripts update, compile scripts.
  watch(config.src.scripts, series(scripts, reload));

  // When views update, compile views.
  watch(config.src.views, series(views, reload));

  done();
};
