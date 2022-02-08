const {join, parse} = require('path');
const {cwd, exit} = require('process');
const {execSync} = require('child_process');
const {coerce, major} = require('semver');
const {sync: runAppleScriptSync} = require('run-applescript');
const ora = require('ora');
const chalk = require('chalk');



/*
 * =============================================================================
 * Prepare System Veriables.
 * =============================================================================
 */

const macOSVersionMajor = major(coerce(runAppleScriptSync('return system version of (system info)')));

const appearanceModes = [
  'Light',
  'Dark'
];

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

if (macOSVersionMajor >= 11) {
  accentColors.unshift('Multicolour');
}



/*
 * =============================================================================
 * Declare Sketch plugin running function.
 * =============================================================================
 */

function runPlugin(filename) {
  const context = {
    output: join(cwd(), 'src/data', `macOS${macOSVersionMajor >= 11 ? 11 : 10}`),
    filename
  };

  execSync(
    [
      sketchToolPath,
      'run',
      join(cwd(), 'scripts', 'get-sketch-theme-colors.sketchplugin'),
      'get-colors',
      `--context="${JSON.stringify(context).replace(/"/g, '\\"')}"`,
      '--without-activating'
    ].join(' ')
  );
}



/*
 * =============================================================================
 * Get or set System Preferences colors.
 * =============================================================================
 */

function preferences(commandType, appearanceMode, accentColor) {
  if (commandType === 'get') {
    commandType = 'return value of';
  } else if (commandType === 'set') {
    commandType = 'click';
  } else {
    new Error('Unrecognized command type. Expected `get` or `set`.');
  }

  const appearanceModeCommand = appearanceMode ? `${commandType} checkbox ${Number.isNaN(Number.parseInt(appearanceMode, 10)) ? `"${appearanceMode}"` : appearanceMode} of window "General" of application process "System Preferences"` : '';
  const accentColorCommand = accentColor ? `${commandType} checkbox "${accentColor}" of window "General" of application process "System Preferences"` : '';

  return runAppleScriptSync(`
    tell application "System Events"
      tell application "System Preferences" to activate
      repeat until exists of checkbox "Dark" of window "General" of application process "System Preferences"
        delay 0.1
      end repeat
      ${appearanceModeCommand}
      ${accentColorCommand}
    end tell
  `);
}



/*
 * =============================================================================
 * Run Script.
 * =============================================================================
 */

/* Get Sketch information.
 * -----------------------------------------------------------------------------
 */
const spinner = ora('Looking for Sketch...').start();

const sketchPath = execSync('mdfind kMDItemCFBundleIdentifier=="com.bohemiancoding.sketch3" | sort | tail -n 1')
  .toString()
  .trim();

if (sketchPath.length === 0) {
  spinner.fail('Sketch not found.\n');
  exit(0);
}

const sketchToolPath = `${sketchPath}/Contents/MacOS/sketchtool`;

const sketchVersion = execSync(
  [
    sketchToolPath,
    '--version'
  ].join(' ')
)
  .toString()
  .match(/\d+(?:\.\d+)?/);

spinner.info(`Getting data from Sketch ${sketchVersion} in ${parse(sketchPath).dir}\n`);


/* Open System Preferences.
 * -----------------------------------------------------------------------------
 */
spinner.start('Opening System Preferences...');

runAppleScriptSync(`
  tell application "System Preferences"
    reveal anchor "Main" of pane id "com.apple.preference.general"
  end tell
`);

spinner.succeed();


/* Get current Apearance Mode and Color.
 * -----------------------------------------------------------------------------
 */
spinner.start('Saving current Appearance Mode and Accent Color...\n');

let currentMode;
let currentColor;

for (const mode of [...appearanceModes, (macOSVersionMajor >= 11 ? 8 : 9)]) { // Also check for "Auto", which is checkbox `9` in macOS Catalina and `8` in Big Sur.
  const value = preferences('get', mode);

  // Set `currentMode` if the checkbox is selected (`1`) and stop loop.
  if (Number.parseInt(value, 10) === 1) {
    currentMode = mode;
    break;
  }
}

for (const color of accentColors) {
  const value = preferences('get', null, color);

  // Set `currentColor` if the checkbox is selected (`1`) and stop loop.
  if (Number.parseInt(value, 10) === 1) {
    currentColor = color;
    break;
  }
}

spinner.succeed();


/* Get Sketch data using all combinations of Apearance Modes and Colors.
 * -----------------------------------------------------------------------------
 */
for (const mode of appearanceModes) {
  spinner.start(`Changing Appearance Mode to ${chalk.bold(mode)}...\n`);

  // Set Appearance Mode.
  preferences('set', mode);

  spinner.succeed();


  // Set Color and get Sketch data.
  for (const color of accentColors) {
    let chalkColor;

    switch (color) {
      case 'Multicolour':
        chalkColor = 'black';
        break;

      case 'Graphite':
        chalkColor = 'gray';
        break;

      default:
        chalkColor = color.toLowerCase();
        break;
    }

    spinner.start(`Changing Accent Color to ${chalk.keyword(chalkColor)(color)}...`);

    // Set Accent Color.
    preferences('set', null, color);

    spinner.succeed();

    spinner.start(`Generating "${mode.toLowerCase() + color}.json"...\n`);

    // Get Sketch data.
    runPlugin(mode.toLowerCase() + color);

    spinner.succeed();
  }
}


/* Revert System Preferences.
 * -----------------------------------------------------------------------------
 */
if (currentMode && currentColor) {
  spinner.start('Reverting Appearance Mode and Accent Color...\n');

  preferences('set', currentMode, currentColor);

  spinner.succeed();
}


/* Close System Preferences.
 * -----------------------------------------------------------------------------
 */
spinner.start('Closing System Preferences...\n');

runAppleScriptSync('tell application "System Preferences" to quit');

spinner.succeed();


/* Get Sketch plist color data.
 * -----------------------------------------------------------------------------
 */
spinner.start('Generating "plist.json"...\n');

runPlugin('plist');

spinner.succeed();


/* End.
 * -----------------------------------------------------------------------------
 */
spinner.info(chalk.bold('All done!\n'));
