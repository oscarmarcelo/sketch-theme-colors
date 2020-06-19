const {join} = require('path');
const {execSync} = require('child_process');
const runAppleScript = require('run-applescript').sync;



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
      '$(mdfind kMDItemCFBundleIdentifier=="com.bohemiancoding.sketch3" | head -n 1)/Contents/MacOS/sketchtool',
      'run',
      join(__dirname, 'get-sketch-theme-colors.sketchplugin'),
      'get-colors',
      `--context="${JSON.stringify(context).replace(/"/g, '\\"')}"`,
      '--without-activating'
    ].join(' ')
  );
}



console.log('Opening System Preferences...');

runAppleScript(`
  tell application "System Preferences"
    reveal anchor "Main" of pane id "com.apple.preference.general"
  end tell
`);



console.log('\nSaving current Appearance Mode and Accent Color...');

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



for (const mode of appearanceModes) {
  console.log(`\nChanging Appearance Mode to ${mode}...`);

  for (const color of accentColors) {
    console.log(`\nChanging Accent Color to ${color}...`);

    runAppleScript(`
      tell application "System Events"
        repeat until exists of checkbox "Dark" of window "General" of application process "System Preferences"
          delay 0.1
        end repeat
        -- Appearance
        click checkbox "${mode}" of window "General" of application process "System Preferences"
        -- Accent Color
        click checkbox "${color}" of window "General" of application process "System Preferences"
      end tell
    `);

    console.log(`Generating "${mode.toLowerCase() + color}.json"...`);
    runPlugin(mode.toLowerCase() + color);
  }
}



if (currentMode && currentColor) {
  console.log('\nReverting Appearance Mode and Accent Color...');

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
}



console.log('\nClosing System Preferences...');

runAppleScript('tell application "System Preferences" to quit');



console.log('\nGenerating "plist.json"...');

runPlugin('plist');



console.log('\nAll done!\n');
