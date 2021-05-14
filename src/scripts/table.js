import {getAppearanceModes, getAccentColors} from './data.js';



const tableHead = document.querySelector('thead');
const tableBody = document.querySelector('tbody');



/*
 * ========================================================
 * Build Theme table header
 * ========================================================
 */

export function buildThemeHeader(macOSVersion) {
  const headRow = document.createElement('tr');

  const variableHeadCell = document.createElement('th');

  variableHeadCell.classList.add('cell', 'cell--head');
  variableHeadCell.textContent = 'Variable';
  headRow.append(variableHeadCell);

  for (const mode of getAppearanceModes()) {
    for (const color of getAccentColors(macOSVersion)) {
      const cell = document.querySelector('#head-th').content.cloneNode(true);
      const th = cell.querySelector('th');

      let colorClass;

      switch (color.toLowerCase()) {
        case 'multicolour':
          colorClass = 'multicolour';
          break;

        case 'orange':
          colorClass = 'bg-yellow-500';
          break;

        case 'yellow':
          colorClass = 'bg-yellow-300';
          break;

        case 'graphite':
          colorClass = 'bg-gray-500';
          break;

        default:
          colorClass = `bg-${color.toLowerCase()}-500`;
          break;
      }

      if (mode === 'Dark') {
        th.classList.add('cell--dark');
      }

      th.dataset.color = color.toLowerCase();
      cell.querySelector('.cell-head__text').textContent = `${mode} ${color}`;
      cell.querySelector('.cell-head__color-icon').classList.add(colorClass);

      headRow.append(cell);
    }
  }

  tableHead.append(headRow);
}



/*
 * ========================================================
 * Build Property List table header
 * ========================================================
 */

export function buildPlistHeader() {
  const headRow = document.createElement('tr');

  const propertyHeadCell = document.createElement('th');

  propertyHeadCell.classList.add('cell', 'cell--head');
  propertyHeadCell.textContent = 'Property';
  headRow.append(propertyHeadCell);

  const valueHeadCell = document.createElement('th');

  valueHeadCell.textContent = 'Light Value';
  valueHeadCell.classList.add('cell', 'cell--head');
  headRow.append(valueHeadCell);

  const interpolationHeadCell = document.createElement('th');

  interpolationHeadCell.textContent = 'Interpolation';
  interpolationHeadCell.classList.add('cell', 'cell--head');
  headRow.append(interpolationHeadCell);

  const darkValueHeadCell = document.createElement('th');

  darkValueHeadCell.classList.add('cell', 'cell--head', 'cell--dark');
  darkValueHeadCell.textContent = 'Dark Value';
  headRow.append(darkValueHeadCell);

  const darkInterpolationHeadCell = document.createElement('th');

  darkInterpolationHeadCell.classList.add('cell', 'cell--head', 'cell--dark');
  darkInterpolationHeadCell.textContent = 'Interpolation';
  headRow.append(darkInterpolationHeadCell);

  tableHead.append(headRow);
}



/*
 * ========================================================
 * Build Theme table body
 * ========================================================
 */

export function buildThemeBody(macOSVersion, sketchVersion) {
  const selectedVersionData = window.sketchData[macOSVersion][sketchVersion];
  const previousVersionData = window.sketchData[macOSVersion][window.sketchVersions[macOSVersion].indexOf(sketchVersion) - 1];

  const tableBodyFragment = new DocumentFragment();

  for (const [variable, colors] of Object.entries(selectedVersionData.theme)) {
    const row = document.createElement('tr');

    const variableCell = document.querySelector('#body-th').content.cloneNode(true);
    const variableCellBadge = variableCell.querySelector('.cell-head__badge');

    variableCell.querySelector('.cell-head__text').textContent = variable;

    row.append(variableCell);

    let diff = false;

    for (const mode of getAppearanceModes()) {
      for (const color of getAccentColors(macOSVersion)) {
        const cell = document.querySelector('#body-td').content.cloneNode(true);
        const td = cell.querySelector('td');
        const themeColor = mode.toLowerCase() + color;
        const hexColor = colors[themeColor];

        if (mode === 'Dark') {
          td.classList.add('cell--dark');
        }

        td.dataset.color = color.toLowerCase();
        td.dataset.value = hexColor;

        // TODO: Handle removed variables.
        const changeType = window.sketchDiff?.[macOSVersion]?.[sketchVersion]?.theme?.[variable]?.[themeColor];

        if (changeType) {
          td.classList.add(`cell--${changeType}`);

          diff = changeType;
        }

        cell.querySelector('.color__preview-inner').style.background = hexColor;
        cell.querySelector('.color__text-rgb').textContent = hexColor.slice(1, 7).toUpperCase();
        cell.querySelector('.color__text-alpha').textContent = hexColor.slice(7).toUpperCase();

        row.append(cell);
      }
    }

    if (diff) {
      variableCellBadge.classList.add(`cell-head__badge--${diff}`);
      variableCellBadge.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
    } else {
      variableCellBadge.remove();
    }

    tableBodyFragment.append(row);
  }

  tableBody.append(tableBodyFragment);


  /* Highlight cell with the same color
  * ----------------------------
  */
  const colorCells = tableBody.querySelectorAll('td');

  for (const currentCell of colorCells) {
    currentCell.addEventListener('mouseenter', () => {
      currentCell.classList.add('cell--highlighted');

      for (const otherCell of colorCells) {
        if (otherCell !== currentCell && otherCell.dataset.value === currentCell.dataset.value) {
          otherCell.classList.add('cell--highlighted');
        }
      }
    });

    currentCell.addEventListener('mouseleave', () => {
      currentCell.classList.remove('cell--highlighted');

      for (const otherCell of colorCells) {
        if (otherCell.classList.contains('cell--highlighted')) {
          otherCell.classList.remove('cell--highlighted');
        }
      }
    });
  }
}



/*
 * ========================================================
 * Build Property List table body
 * ========================================================
 */

export function buildPlistBody(macOSVersion, sketchVersion) {
  const selectedVersionData = window.sketchData[macOSVersion][sketchVersion];
  const previousVersionData = window.sketchData[macOSVersion][window.sketchVersions[macOSVersion].indexOf(sketchVersion) - 1];

  const tableBodyFragment = new DocumentFragment();

  for (const [property, variations] of Object.entries(selectedVersionData.plist)) {
    const row = document.createElement('tr');

    const propertyCell = document.querySelector('#body-th').content.cloneNode(true);
    const propertyCellBadge = propertyCell.querySelector('.cell-head__badge');

    propertyCell.querySelector('th').classList.add('py-0');

    const propertyCellText = [];

    if (variations.light) {
      propertyCellText.push(variations.light.name);
    }

    if (variations.dark) {
      propertyCellText.push(variations.dark.name);
    }

    propertyCell.querySelector('.cell-head__text').innerHTML = propertyCellText.join('<br>');

    row.append(propertyCell);

    let diff = false;

    const valueCell = document.createElement('td');
    const interpolationCell = document.querySelector('#body-td').content.cloneNode(true);
    const darkValueCell = document.createElement('td');
    const darkInterpolationCell = document.querySelector('#body-td').content.cloneNode(true);

    darkValueCell.classList.add('cell--dark');
    darkInterpolationCell.querySelector('td').classList.add('cell--dark');

    if (variations.light) {
      valueCell.textContent = variations.light.value;
    }

    if (variations.dark) {
      darkValueCell.textContent = variations.dark.value;
    }

    // TODO: Handle removed variables.
    const changes = window.sketchDiff?.[macOSVersion]?.[sketchVersion]?.plist?.[property];

    if (changes) {
      if (changes.light?.value) {
        valueCell.classList.add(`cell--${changes?.light?.value}`);
        diff = diff && diff !== changes?.light?.value ? 'changed' : changes?.light?.value;
      }

      if (changes.light?.interpolation) {
        interpolationCell.querySelector('td').classList.add(`cell--${changes?.light?.interpolation}`);
        diff = diff && diff !== changes?.light?.interpolation ? 'changed' : changes?.light?.interpolation;
      }

      if (changes.dark?.value) {
        darkValueCell.classList.add(`cell--${changes?.dark?.value}`);
        diff = diff && diff !== changes?.dark?.value ? 'changed' : changes?.dark?.value;
      }

      if (changes.dark?.interpolation) {
        darkInterpolationCell.querySelector('td').classList.add(`cell--${changes?.dark?.interpolation}`);
        diff = diff && diff !== changes?.dark?.interpolation ? 'changed' : changes?.dark?.interpolation;
      }
    }

    if (diff) {
      propertyCellBadge.classList.add(`cell-head__badge--${diff}`);
      propertyCellBadge.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
    } else {
      propertyCellBadge.remove();
    }

    if (variations.light?.interpolation) {
      interpolationCell.querySelector('.color__preview-inner').style.background = variations.light.interpolation;
      interpolationCell.querySelector('.color__text-rgb').textContent = variations.light.interpolation.slice(1, 7).toUpperCase();
      interpolationCell.querySelector('.color__text-alpha').textContent = variations.light.interpolation.slice(7).toUpperCase();
    } else {
      interpolationCell.querySelector('.color').remove();

      if (!variations.light) {
        valueCell.classList.add('bg-gray-200');
        interpolationCell.querySelector('td').classList.add('bg-gray-200');
      }
    }

    if (variations.dark?.interpolation) {
      darkInterpolationCell.querySelector('.color__preview-inner').style.background = variations.dark.interpolation;
      darkInterpolationCell.querySelector('.color__text-rgb').textContent = variations.dark.interpolation.slice(1, 7).toUpperCase();
      darkInterpolationCell.querySelector('.color__text-alpha').textContent = variations.dark.interpolation.slice(7).toUpperCase();
    } else {
      darkInterpolationCell.querySelector('.color').remove();

      if (!variations.dark) {
        darkValueCell.classList.add('bg-gray-900');
        darkInterpolationCell.querySelector('td').classList.add('bg-gray-900');
      }
    }

    row.append(valueCell);
    row.append(interpolationCell);
    row.append(darkValueCell);
    row.append(darkInterpolationCell);

    tableBodyFragment.append(row);
  }

  tableBody.append(tableBodyFragment);
}



/*
 * ========================================================
 * Clear table header
 * ========================================================
 */

export function clearHeader() {
  for (const row of tableHead.querySelectorAll('tr')) {
    row.remove();
  }
}



/*
 * ========================================================
 * Clear table body
 * ========================================================
 */

export function clearBody() {
  for (const row of tableBody.querySelectorAll('tr')) {
    row.remove();
  }
}
