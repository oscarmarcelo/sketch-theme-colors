const {join} = require('path');
const {toArray} = require('util');
const sketchVersion = require('sketch').version.sketch;



function getColor(namedColor) {
  const mscolor = MSColor.colorWithNSColor(MSTheme.sharedTheme()[namedColor]());
  const color = mscolor.NSColorWithColorSpace(nil).hexValue().toLowerCase();
  const alpha = mscolor.alpha() < 1 ? Math.round(mscolor.alpha() * 255).toString(16).padStart(2, 0) : '';

  return `#${color}${alpha}`;
}



function saveToFile(path, filename, contents) {
  try {
    const filePath = join(path, `v${sketchVersion}`);
    const fileContents = NSString.stringWithFormat('%@', JSON.stringify(contents, null, 2));

    NSFileManager.defaultManager().createDirectoryAtPath_withIntermediateDirectories_attributes_error(filePath, true, nil, nil);

    fileContents.writeToFile_atomically_encoding_error(join(filePath, `${filename}.json`), true, NSUTF8StringEncoding, nil);
  } catch (error) {
    console.error(error);
  }
}



function onRun(context) { // eslint-disable-line no-unused-vars
  const result = {};

  if (String(context.filename) === 'plist') {
    const colorPlist = MSTheme.sharedTheme().colorPlist();

    for (const property in colorPlist) {
      if (Object.prototype.hasOwnProperty.call(colorPlist, property)) {
        result[property] = String(colorPlist[property]);
      }
    }
  } else {
    const themeProperties = toArray(MSTheme.sharedTheme().class().mocha().properties());

    for (const property of themeProperties) {
      if (String(property.typeEncoding()) === '@"NSColor"') {
        result[property.name()] = getColor(property.name());
      }
    }
  }

  saveToFile(context.output, context.filename, result);
}
