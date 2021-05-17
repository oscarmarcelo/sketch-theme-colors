const {join, dirname} = require('path');
const {cwd} = require('process');
const {readFileSync, readdirSync, statSync, mkdirSync, writeFileSync} = require('fs');
const {coerce, compare} = require('semver');



/*
 * ========================================================
 * macOS appearance modes.
 * ========================================================
 */

const appearanceModes = [
  'Light',
  'Dark'
];



/*
 * ========================================================
 * macOS accent colors.
 * ========================================================
 */

function getAccentColors(macOSVersion) {
  const accentColors = [
    'Blue',
    'Purple',
    'Pink',
    'Red',
    'Orange',
    'Yellow',
    'Green',
    'Graphite'
  ];

  if (macOSVersion.endsWith('11')) {
    accentColors.unshift('Multicolour');
  }

  return accentColors;
}



/*
 * =============================================================================
 * Get the contents of a JSON file.
 * =============================================================================
 */

function loadJSON (filePath) {
  return JSON.parse(readFileSync(filePath));
}



/*
 * =============================================================================
 * Sort versions by release.
 * =============================================================================
 */

function sortByRelease (a, b) {
  a = coerce(a);
  b = coerce(b);

  return compare(b, a);
}



/*
 * =============================================================================
 * Get the Sketch versions of the collected data, organized by macOS versions.
 * =============================================================================
 */

function getVersions () {
  const root = join(cwd(), 'src/data/');
  const macOSVersions = readdirSync(root)
    .filter(dirname => statSync(join(root, dirname)).isDirectory())
    .sort(sortByRelease);
  const versions = {};

  macOSVersions.forEach(macOSVersion => {
    const macOSVersionRoot = join(root, macOSVersion);
    versions[macOSVersion] = readdirSync(macOSVersionRoot)
      .filter(dirname => statSync(join(macOSVersionRoot, dirname)).isDirectory())
      .sort(sortByRelease);
  });

  return versions;
}



/*
 * =============================================================================
 * Get all data of a Sketch version.
 * =============================================================================
 */

function getRawData (macOSVersion, sketchVersion) {
  const sketchVersionRoot = join(cwd(), 'src/data/', macOSVersion, sketchVersion);
  const rawData = {
    theme: {},
    plist: loadJSON(join(sketchVersionRoot, 'plist.json'))
  };

  appearanceModes.forEach(mode => {
    getAccentColors(macOSVersion).forEach(color => {
      const themeName = mode.toLowerCase() + color;

      rawData.theme[themeName] = loadJSON(join(sketchVersionRoot, `${themeName}.json`));
    });
  });

  return rawData;
}



/*
 * =============================================================================
 * Mount the data of a Sketch version.
 * =============================================================================
 */

function mountData (rawData) {
  const mountedData = {
    theme: {},
    plist: {}
  };

  for (const [theme, themeData] of Object.entries(rawData.theme)) {
    for (const [variable, value] of Object.entries(themeData)) {
      mountedData.theme[variable] = mountedData.theme[variable] || {};
      mountedData.theme[variable][theme] = value;
    }
  }

  for (const [variable, value] of Object.entries(rawData.plist)) {
    const mode = variable.includes('-dark') ? 'dark' : 'light';
    const property = variable.replace('-dark', '');
    const interpolation = interpolateValue(rawData.plist, value);

    mountedData.plist[property] = mountedData.plist[property] || {};
    mountedData.plist[property][mode] = {
      name: variable,
      value
    };
    if (interpolation) {
      mountedData.plist[property][mode].interpolation = interpolation;
    }
  }

  return mountedData;
}



/*
 * =============================================================================
 * Interpolate the plist values of a Sketch version.
 * Interpolation of all values isn't guaranteed.
 * =============================================================================
 */

function interpolateValue (plist, value) {
  const isHex = /^#([\da-f]{3,8})(?::alpha\((\d?\.?\d+)\))?$/i; // Look for hex colors with and without `:alpha(#.#)`.
  const isRGB = /^s?rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d?\.?\d+))?\)$/i; // Look for (s)rgb(a) colors.
  const isVar = /^\$([\w-]+)(?::alpha\((\d?\.?\d+)\))?$/i; // Look for variables with and without `:alpha(#.#)`.

  if (isHex.test(value)) {
    const matches = value.match(isHex);

    value = normalizeHex(matches[1], matches[2] || null);
  } else if (isRGB.test(value)) {
    const matches = value.match(isRGB);

    value = rgbToHex(matches[1], matches[2], matches[3], matches[4] || null);
  } else if (isVar.test(value)) {
    const matches = value.match(isVar);

    value = interpolateValue(plist, plist[matches[1]]);

    if (value && matches[2]) {
      value = applyAlpha(value, matches[2]);
    }
  } else {
    value = false;
  }

  return value;
}



/*
 * =============================================================================
 * Normalize hexadecimal color values.
 * =============================================================================
 */

function normalizeHex (hex, alpha) {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  if ([3, 4].includes(hex.length)) {
    hex = hex.split('').map(char => char + char).join('');
  }

  if (alpha) {
    hex = applyAlpha(hex, alpha);
  }

  return '#' + hex.toUpperCase();
}



/*
 * =============================================================================
 * Convert RGB color values to hexadecimal color values.
 * =============================================================================
 */

function rgbToHex (red, green, blue, alpha) {
  let hex = '#';

  hex += Number(red).toString(16).padStart(2, 0);
  hex += Number(green).toString(16).padStart(2, 0);
  hex += Number(blue).toString(16).padStart(2, 0);

  if (alpha) {
    hex = applyAlpha(hex, alpha);
  }

  return hex.toUpperCase();
}



/*
 * =============================================================================
 * Apply alpha channel to hexadecimal color values.
 * =============================================================================
 */

function applyAlpha (hex, alpha) {
  alpha = Number(alpha);

  if (alpha < 1) {
    hex += Math.round(alpha * 255).toString(16).padStart(2, 0);
  }

  return hex.toUpperCase();
}



/*
 * =============================================================================
 * Write a File, possibily in a non-existent path.
 * =============================================================================
 */

function writeFile(path, data) {
  mkdirSync(dirname(path), {
    recursive: true
  });

  writeFileSync(path, JSON.stringify(data));
}



/*
 * =============================================================================
 * Purge empty object properties.
 * =============================================================================
 */

function purgeObjectProperties(object) {
  for (const key in object) {
    if (typeof object[key] === 'object' && Object.keys(object[key]).length > 0) {
      purgeObjectProperties(object[key]);
    }

    if ((typeof object[key] === 'object' && Object.keys(object[key]).length === 0) || object[key] === 0) {
      delete object[key];
    }
  }
}



/*
 * =============================================================================
 * Gather all data and generate the production files.
 * =============================================================================
 */

/* Generate versions file.
 * -----------------------------------------------------------------------------
 */
const versions = getVersions();

writeFile(join(cwd(), 'build/assets/data', 'versions.json'), versions);


/* Get raw data.
 * -----------------------------------------------------------------------------
 */
const rawData = {};

for (const [macOSVersion, sketchVersions] of Object.entries(versions)) {
  rawData[macOSVersion] = {};

  sketchVersions.forEach(sketchVersion => {
    rawData[macOSVersion][sketchVersion] = getRawData(macOSVersion, sketchVersion);
  });
}


/* Mount data and generate files.
 * -----------------------------------------------------------------------------
 */
const mountedData = {};

for (const [macOSVersion, sketchVersions] of Object.entries(rawData)) {
  mountedData[macOSVersion] = {};

  for (const [sketchVersion, versionData] of Object.entries(sketchVersions)) {
    const mountedVersionData = mountData(versionData);

    mountedData[macOSVersion][sketchVersion] = mountedVersionData;

    writeFile(join(cwd(), 'build/assets/data', macOSVersion, `${sketchVersion}.json`), mountedVersionData);
  }
}


/* Generate diff file.
 * -----------------------------------------------------------------------------
 */
const diffData = {};

for (const [macOSVersion, sketchVersions] of Object.entries(mountedData)) {
  diffData[macOSVersion] = {};

  for (const [sketchVersion, versionData] of Object.entries(sketchVersions)) {
    const previousVersion = Object.keys(sketchVersions)[Object.keys(sketchVersions).indexOf(sketchVersion) + 1];

    if (previousVersion) {
      const previousVersionData = JSON.parse(JSON.stringify(sketchVersions[previousVersion]));

      const diff = {
        theme: {},
        plist: {},
        counters: {
          added: 0,
          changed: 0,
          removed: 0
        }
      };

      for (const [variable, themeValues] of Object.entries(versionData.theme)) {
        diff.theme[variable] = diff.theme[variable] || {};

        for (const [theme, value] of Object.entries(themeValues)) {
          if (previousVersionData.theme?.[variable]?.[theme]) {
            if (previousVersionData.theme[variable][theme] !== value) {
              diff.theme[variable][theme] = 'changed';
              diff.counters.changed++;
            }
            delete previousVersionData.theme[variable][theme];
          } else {
            diff.theme[variable][theme] = 'added';
            diff.counters.added++;
          }
        }
      }

      for (const [variable, themeValues] of Object.entries(previousVersionData.theme)) {
        diff.theme[variable] = diff.theme[variable] || {};

        for (const theme of Object.keys(themeValues)) {
          diff.theme[variable][theme] = 'removed';
          diff.counters.removed++;
        }
      }

      for (const [variable, modeValues] of Object.entries(versionData.plist)) {
        diff.plist[variable] = diff.plist[variable] || {};

        for (const [mode, values] of Object.entries(modeValues)) {
          diff.plist[variable][mode] = diff.plist[variable][mode] || {};

          ['value', 'interpolation'].forEach(valueKey => {
            if (previousVersionData.plist?.[variable]?.[mode]?.[valueKey]) {
              if (previousVersionData.plist[variable][mode][valueKey] !== values[valueKey]) {
                diff.plist[variable][mode][valueKey] = 'changed';
                diff.counters.changed++;
              }
              delete previousVersionData.plist[variable][mode][valueKey];
            } else if (values[valueKey]) {
              diff.plist[variable][mode][valueKey] = 'added';
              diff.counters.added++;
            }
          });
        }
      }

      for (const [variable, modeValues] of Object.entries(previousVersionData.plist)) {
        diff.plist[variable] = diff.plist[variable] || {};

        for (const mode of Object.keys(modeValues)) {
          diff.plist[variable][mode] = diff.plist[variable][mode] || {};

          ['value', 'interpolation'].forEach(valueKey => {
            if (previousVersionData.plist[variable][mode][valueKey]) {
              diff.plist[variable][mode][valueKey] = 'removed';
              diff.counters.removed++;
            }
          });
        }
      }

      diffData[macOSVersion][sketchVersion] = diff;
    }
  }
}

purgeObjectProperties(diffData);

writeFile(join(cwd(), 'build/assets/data', 'diff.json'), diffData);
