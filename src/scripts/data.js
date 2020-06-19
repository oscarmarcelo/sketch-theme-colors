/*
 * ========================================================
 * Versions with available data.
 * ========================================================
 */

export const sketchVersions = [
  'v59.1',
  'v60',
  'v60.1',
  'v61',
  'v62',
  'v63',
  'v63.1',
  'v64',
  'v65',
  'v65.1',
  'v66',
  'v66.1'
];


/*
 * ========================================================
 * macOS appearance modes.
 * ========================================================
 */

export const appearanceModes = [
  'Light',
  'Dark'
];



/*
 * ========================================================
 * macOS accent colors.
 * ========================================================
 */

export const accentColors = [
  'Blue',
  'Purple',
  'Pink',
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Graphite'
];



/*
 * ========================================================
 * Load a JSON file.
 * ========================================================
 */

async function loadJSON(path) {
  const response = await fetch(path);
  const data = await response.json();

  return data;
}



/*
 * ========================================================
 * Create an object with all JSONs.
 * ========================================================
 */

export async function getData() {
  const sketchData = {};

  for await (const version of sketchVersions) {
    sketchData[version] = {
      themes: {},
      plist: {}
    };

    for await (const mode of appearanceModes) {
      for await (const color of accentColors) {
        await loadJSON(`./assets/data/${version}/${mode.toLowerCase() + color}.json`)
          .then(data => {
            sketchData[version].themes[mode.toLowerCase() + color] = data;
          });
      }
    }

    await loadJSON(`./assets/data/${version}/plist.json`)
      .then(data => {
        sketchData[version].plist = data;
      });
  }

  return sketchData;
}



/*
 * ========================================================
 * Mount Data to be ready to be consumed by `./table.js`.
 * ========================================================
 */

export function mountData(data) {
  window.sketchData = {};

  for (const [version, versionData] of Object.entries(data)) {
    window.sketchData[version] = {
      theme: {},
      plist: {}
    };

    for (const [theme, themeData] of Object.entries(versionData.themes)) {
      for (const [variable, value] of Object.entries(themeData)) {
        window.sketchData[version].theme[variable] = window.sketchData[version].theme[variable] || {};

        window.sketchData[version].theme[variable][theme] = value;
      }
    }

    const plist = Object.entries(versionData.plist);

    while (plist.length > 0) {
      const [property, value] = plist.shift();

      const mode = property.includes('-dark') ? 'dark' : 'light';
      const propertyName = property.replace('-dark', '');
      const interpolation = interpolateValue(versionData.plist, value);

      window.sketchData[version].plist[propertyName] = window.sketchData[version].plist[propertyName] || {};

      window.sketchData[version].plist[propertyName][mode] = {
        property,
        value
      };

      if (interpolation) {
        window.sketchData[version].plist[propertyName][mode].interpolation = interpolation;
      }
    }
  }
}



function interpolateValue(plist, value) {
  const isHex = /^#([\da-f]{3,8})(?::alpha\((\d?\.?\d+)\))?$/i; // Look for hex colors with and without `:alpha(#.#)`.
  const isRGB = /^s?rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d?\.?\d+))?\)$/i; // Look for (s)rgb(a) colors.
  const isVar = /^\$([\w-]+)(?::alpha\((\d?\.?\d+)\))?$/i; // Look for variables with and without `:alpha(#.#)`.

  if (isHex.test(value)) {
    const matches = value.match(isHex);

    value = normalizeHex(matches[1], matches[2] || null);
  } else if (isRGB.test(value)) { // Look for (s)rgb(a) colors.
    const matches = value.match(isRGB);

    value = rgbToHex(matches[1], matches[2], matches[3], matches[4] || null);
  } else if (isVar.test(value)) {
    const matches = value.match(isVar);

    value = interpolateValue(plist, plist[matches[1]]);
  } else {
    value = false;
  }

  return value;
}

function normalizeHex(hex, alpha) {
  if (hex.startsWith('#')) {
    hex = hex.slice(1);
  }

  if ([3, 4].includes(hex.length)) {
    hex = hex.split('').map(char => char + char).join('');
  }

  if (alpha) {
    hex += Math.round(Number(alpha) * 255).toString(16).padStart(2, 0);
  }

  return '#' + hex.toUpperCase();
}



function rgbToHex(red, green, blue, alpha) {
  let hex = '#';

  hex += Number(red).toString(16).padStart(2, 0);
  hex += Number(green).toString(16).padStart(2, 0);
  hex += Number(blue).toString(16).padStart(2, 0);

  if (alpha) {
    hex += Math.round(Number(alpha) * 255).toString(16).padStart(2, 0);
  }

  return hex;
}