/*
 * =============================================================================
 * Load a JSON file.
 * =============================================================================
 */

async function loadJSON (path) {
  const response = await fetch(path);
  const data = await response.json();

  return data;
}



/*
 * =============================================================================
 * Get the list of all available Sketch versions, categorized by macOS versions.
 * =============================================================================
 */

export async function loadVersionList() {
  return loadJSON('assets/data/versions.json');
}



/*
 * =============================================================================
 * Load data from a specific Sketch version.
 * =============================================================================
 */

export async function loadVersion (macOSVersion, sketchVersion) {
  return loadJSON(`assets/data/${macOSVersion}/${sketchVersion}.json`);
}



/*
 * =============================================================================
 * Load the diff data.
 * =============================================================================
 */

export async function loadDiff() {
  return loadJSON('assets/data/diff.json');
}



/*
 * ========================================================
 * macOS appearance modes.
 * ========================================================
 */

export function getAppearanceModes () {
  return [
    'Light',
    'Dark'
  ];
}



/*
 * ========================================================
 * macOS accent colors.
 * ========================================================
 */

export function getAccentColors(macOSVersion) {
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
