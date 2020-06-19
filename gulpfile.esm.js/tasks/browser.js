import {init, reload as bsReload} from 'browser-sync';

import config from '../config';



/**
 * ================================
 * Create static server with live reload.
 * ================================
 */

export const serve = done => {
  init({
    server: config.build.base,
    ghostMode: false
  });
  done();
};



/**
 * ================================
 * Reload browser.
 * ================================
 */

export const reload = done => {
  bsReload();
  done();
};
