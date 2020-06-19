const src = {};
const build = {};
const dist = {};

src.base = './src';

build.base = './build';
build.assets = `${build.base}/assets`;

dist.base = './dist';


export default {
  src: {
    styles: `${src.base}/styles/**/*.css`,
    scripts: `${src.base}/scripts/**/*.js`,
    data: `${src.base}/data/**/*.json`,
    views: `${src.base}/views/**/*.pug`
  },
  build: {
    base: build.base,
    styles: `${build.assets}/styles`,
    scripts: `${build.assets}/scripts`,
    data: `${build.assets}/data`,
    views: build.base,
    globs: {
      base: `${build.base}/**/*`,
      styles: `${build.assets}/**/*.css`,
      scripts: `${build.assets}/**/*.js`
    }
  },
  dist: {
    base: dist.base,
    globs: {
      all: `${dist.base}/**/*`
    }
  }
};
