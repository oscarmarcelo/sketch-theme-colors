#!/usr/bin/env node

const {join, parse} = require('path');
const {execSync} = require('child_process');
const runAppleScript = require('run-applescript').sync;
const ora = require('ora');
const chalk = require('chalk');



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



function runPlugin(filename) {
  const context = {
    output: join(process.cwd(), 'src/data'),
    filename
  };

  execSync(
    [
      sketchToolPath,
      'run',
      join(__dirname, 'get-sketch-theme-colors.sketchplugin'),
      'get-colors',
      `--context="${JSON.stringify(context).replace(/"/g, '\\"')}"`,
      '--without-activating'
    ].join(' ')
  );
}



const spinner = ora('Looking for Sketch...').start();

const sketchPath = execSync('mdfind kMDItemCFBundleIdentifier=="com.bohemiancoding.sketch3" | head -n 1')
  .toString()
  .trim();

if (sketchPath.length === 0) {
  spinner.fail('Sketch not found.\n');
  process.exit(0);
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



spinner.start('Opening System Preferences...');

runAppleScript(`
tell application "System Preferences"
reveal anchor "Main" of pane id "com.apple.preference.general"
end tell
`);

spinner.succeed();



spinner.start('Saving current Appearance Mode and Accent Color...\n');

let currentMode;
let currentColor;

for (const mode of [...appearanceModes, 9]) { // Also check for "Auto", which is checkbox `9` in macOS Catalina.
  const value = runAppleScript(`
    tell application "System Events"
      repeat until exists of checkbox "Dark" of window "General" of application process "System Preferences"
        delay 0.1
      end repeat
      return value of checkbox ${Number.isNaN(Number.parseInt(mode, 10)) ? `"${mode}"` : mode} of window "General" of application process "System Preferences"
    end tell
  `);

  if (Number.parseInt(value, 10) === 1) {
    currentMode = mode;
    break;
  }
}

for (const color of accentColors) {
  const value = runAppleScript(`
    tell application "System Events"
      repeat until exists of checkbox "Dark" of window "General" of application process "System Preferences"
        delay 0.1
      end repeat
      return value of checkbox "${color}" of window "General" of application process "System Preferences"
    end tell
  `);

  if (Number.parseInt(value, 10) === 1) {
    currentColor = color;
    break;
  }
}

spinner.succeed();



for (const mode of appearanceModes) {
  spinner.start(`Changing Appearance Mode to ${chalk.bold(mode)}...\n`);

  runAppleScript(`
    tell application "System Events"
      repeat until exists of checkbox "Dark" of window "General" of application process "System Preferences"
        delay 0.1
      end repeat
      -- Appearance
      click checkbox "${mode}" of window "General" of application process "System Preferences"
    end tell
  `);

  spinner.succeed();


  for (const color of accentColors) {
    spinner.start(`Changing Accent Color to ${chalk.keyword(color === 'Graphite' ? 'gray' : color.toLowerCase())(color)}...`);

    runAppleScript(`
      tell application "System Events"
        repeat until exists of checkbox "Dark" of window "General" of application process "System Preferences"
          delay 0.1
        end repeat
        -- Accent Color
        click checkbox "${color}" of window "General" of application process "System Preferences"
      end tell
    `);

    spinner.succeed();


    spinner.start(`Generating "${mode.toLowerCase() + color}.json"...\n`);

    runPlugin(mode.toLowerCase() + color);

    spinner.succeed();
  }
}



if (currentMode && currentColor) {
  spinner.start('Reverting Appearance Mode and Accent Color...\n');

  runAppleScript(`
    tell application "System Events"
      repeat until exists of checkbox "Dark" of window "General" of application process "System Preferences"
        delay 0.1
      end repeat
      -- Appearance
      click checkbox ${Number.isNaN(Number.parseInt(currentMode, 10)) ? `"${currentMode}"` : currentMode} of window "General" of application process "System Preferences"
      -- Accent Color
      click checkbox "${currentColor}" of window "General" of application process "System Preferences"
    end tell
  `);

  spinner.succeed();
}



spinner.start('Closing System Preferences...\n');

runAppleScript('tell application "System Preferences" to quit');

spinner.succeed();



spinner.start('Generating "plist.json"...\n');

runPlugin('plist');

spinner.succeed();



spinner.info(chalk.bold('All done!\n'));
