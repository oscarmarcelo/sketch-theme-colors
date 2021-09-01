import {getAppearanceModes, getAccentColors} from './data.js';
import {setTooltipContent, positionTooltip, showTooltip, hideTooltip} from './tooltip.js';



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

  for (const mode of getAppearanceModes()) {
    ['Value', 'Interpolation'].forEach(valueKey => {
      const cell = document.createElement('th');

      cell.textContent = (valueKey === 'Value' ? `${mode} ` : '') + valueKey;
      cell.classList.add('cell', 'cell--head');

      if (mode === 'Dark') {
        cell.classList.add('cell--dark');
      }

      headRow.append(cell);
    });
  }

  tableHead.append(headRow);
}



/*
 * ========================================================
 * Build Theme table body
 * ========================================================
 */

export function buildThemeBody(macOSVersion, sketchVersion) {
  const selectedVersionData = JSON.parse(JSON.stringify(window.sketchData[macOSVersion][sketchVersion].theme));
  const previousVersion = window.sketchVersions.list[macOSVersion][window.sketchVersions.list[macOSVersion].indexOf(sketchVersion) + 1];
  const previousVersionData = window.sketchData[macOSVersion][previousVersion]?.theme;

  const tableBodyFragment = new DocumentFragment();

  if (window.sketchDiff?.[macOSVersion]?.[sketchVersion]?.theme) {
    for (const [variable, colors] of Object.entries(window.sketchDiff[macOSVersion][sketchVersion].theme)) {
      selectedVersionData[variable] = selectedVersionData[variable] || {};

      for (const theme of Object.keys(colors)) {
        if (typeof selectedVersionData[variable][theme] === 'undefined') {
          selectedVersionData[variable][theme] = null;
        }
      }
    }
  }

  for (const [variable, colors] of Object.entries(selectedVersionData)) {
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
        const changeType = window.sketchDiff?.[macOSVersion]?.[sketchVersion]?.theme?.[variable]?.[themeColor];

        td.dataset.color = color.toLowerCase();

        if (mode === 'Dark') {
          td.classList.add('cell--dark');
        }

        if (changeType) {
          td.classList.add(`cell--${changeType}`);

          if (['changed', 'removed'].includes(changeType)) {
            td.dataset.previousColor = previousVersionData[variable][themeColor];
          }

          diff = changeType;
        }

        if (changeType === 'removed') {
          td.classList.add('pl-14');

          td.querySelector('.color').remove();

          td.innerHTML = '&ndash;';
        } else {
          const hexColor = colors[themeColor];

          td.dataset.value = hexColor;

          cell.querySelector('.color__preview-inner').style.background = hexColor;
          cell.querySelector('.color__text-rgb').textContent = hexColor.slice(1, 7).toUpperCase();
          cell.querySelector('.color__text-alpha').textContent = hexColor.slice(7).toUpperCase();
        }

        row.append(cell);
      }
    }

    if (diff) {
      variableCellBadge.classList.add(`cell-head__badge--${diff}`);
      variableCellBadge.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);

      row.dataset.changeType = diff;
    } else {
      variableCellBadge.remove();
    }

    tableBodyFragment.append(row);
  }

  tableBody.append(tableBodyFragment);


  /* Cell interactions.
   * -----------------------------------------------------------------------------
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

    if (currentCell.classList.contains('cell--changed') || currentCell.classList.contains('cell--removed')) {
      currentCell.addEventListener('mouseenter', () => {
        const color = document.querySelector('#color').content.cloneNode(true);

        const hexColor = currentCell.dataset.previousColor;

        color.querySelector('.color__preview-inner').style.background = hexColor;
        color.querySelector('.color__text-rgb').textContent = hexColor.slice(1, 7).toUpperCase();
        color.querySelector('.color__text-alpha').textContent = hexColor.slice(7).toUpperCase();

        setTooltipContent(color);
        positionTooltip(currentCell);
        showTooltip();
      });

      currentCell.addEventListener('mouseleave', hideTooltip);
    }
  }
}



/*
 * ========================================================
 * Build Property List table body
 * ========================================================
 */

export function buildPlistBody(macOSVersion, sketchVersion) {
  const selectedVersionData = JSON.parse(JSON.stringify(window.sketchData[macOSVersion][sketchVersion].plist));
  const previousVersion = window.sketchVersions.list[macOSVersion][window.sketchVersions.list[macOSVersion].indexOf(sketchVersion) + 1];
  const previousVersionData = window.sketchData[macOSVersion][previousVersion]?.plist;

  const tableBodyFragment = new DocumentFragment();

  if (window.sketchDiff?.[macOSVersion]?.[sketchVersion]?.plist) {
    for (const [property, variations] of Object.entries(window.sketchDiff[macOSVersion][sketchVersion].plist)) {
      selectedVersionData[property] = selectedVersionData[property] || {};

      for (const mode of Object.keys(variations)) {
        if (typeof selectedVersionData[property][mode] === 'undefined') {
          selectedVersionData[property][mode] = {
            name: previousVersionData[property][mode].name
          };
        }

        for (const valueKey of Object.keys(mode)) {
          if (typeof selectedVersionData[property][mode][valueKey] === 'undefined') {
            selectedVersionData[property][mode][valueKey] = null;
          }
        }
      }
    }
  }

  for (const [property, variations] of Object.entries(selectedVersionData)) {
    const row = document.createElement('tr');

    const propertyCell = document.querySelector('#body-th').content.cloneNode(true);
    const propertyCellBadge = propertyCell.querySelector('.cell-head__badge');

    propertyCell.querySelector('th').classList.add('py-0');

    const propertyCellText = [];

    getAppearanceModes().forEach(mode => {
      mode = mode.toLowerCase();

      if (variations[mode]) {
        propertyCellText.push(variations[mode].name);
      }
    });

    propertyCell.querySelector('.cell-head__text').innerHTML = propertyCellText.join('<br>');

    row.append(propertyCell);

    let diff = false;

    const cells = {};

    getAppearanceModes().forEach(mode => {
      mode = mode.toLowerCase();

      cells[mode] = {};

      ['value', 'interpolation'].forEach(valueKey => {
        cells[mode][valueKey] = document.querySelector('#body-td').content.cloneNode(true);
      });

      if (mode === 'dark') {
        cells[mode].value.querySelector('td').classList.add('cell--dark');
        cells[mode].interpolation.querySelector('td').classList.add('cell--dark');
      }

      if (variations[mode]) {
        cells[mode].value.querySelector('td').textContent = variations[mode].value;
      }

      const changes = window.sketchDiff?.[macOSVersion]?.[sketchVersion]?.plist?.[property];

      if (changes) {
        ['value', 'interpolation'].forEach(valueKey => {
          if (changes[mode]?.[valueKey]) {
            cells[mode][valueKey].querySelector('td').classList.add(`cell--${changes[mode][valueKey]}`);
            diff = diff && diff !== changes[mode][valueKey] ? 'changed' : changes[mode][valueKey];

            if (['changed', 'removed'].includes(changes[mode][valueKey])) {
              const datasetValue = valueKey === 'interpolation' ? 'previousColor' : 'previousValue';

              cells[mode][valueKey].querySelector('td').dataset[datasetValue] = previousVersionData[property][mode][valueKey];
            }

            if (changes[mode][valueKey] === 'removed') {
              cells[mode][valueKey].querySelector('td').innerHTML = '&ndash;';

              if (valueKey === 'interpolation') {
                cells[mode][valueKey].querySelector('td').classList.add('pl-14');
              }
            }
          }
        });
      }

      if (variations[mode]?.interpolation) {
        cells[mode].interpolation.querySelector('.color__preview-inner').style.background = variations[mode].interpolation;
        cells[mode].interpolation.querySelector('.color__text-rgb').textContent = variations[mode].interpolation.slice(1, 7).toUpperCase();
        cells[mode].interpolation.querySelector('.color__text-alpha').textContent = variations[mode].interpolation.slice(7).toUpperCase();
      } else {
        cells[mode].interpolation.querySelector('.color')?.remove();

        const colorShade = mode === 'dark' ? 900 : 200;

        if (!variations[mode]) {
          ['value', 'interpolation'].forEach(valueKey => {
            if (valueKey === 'value') {
              cells[mode][valueKey].querySelector('.color')?.remove();
            }
            cells[mode][valueKey].querySelector('td').classList.add(`bg-gray-${colorShade}`);
          });
        }
      }

      ['value', 'interpolation'].forEach(valueKey => {
        row.append(cells[mode][valueKey]);
      });
    });

    if (diff) {
      propertyCellBadge.classList.add(`cell-head__badge--${diff}`);
      propertyCellBadge.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);

      row.dataset.changeType = diff;
    } else {
      propertyCellBadge.remove();
    }

    tableBodyFragment.append(row);
  }

  tableBody.append(tableBodyFragment);

  /* Cell interactions.
   * -----------------------------------------------------------------------------
   */
  const cells = tableBody.querySelectorAll('td');

  for (const currentCell of cells) {
    if (currentCell.classList.contains('cell--changed') || currentCell.classList.contains('cell--removed')) {
      currentCell.addEventListener('mouseenter', () => {

        if (currentCell.dataset.previousColor) {
          const color = document.querySelector('#color').content.cloneNode(true);
          const hexColor = currentCell.dataset.previousColor;

          color.querySelector('.color__preview-inner').style.background = hexColor;
          color.querySelector('.color__text-rgb').textContent = hexColor.slice(1, 7).toUpperCase();
          color.querySelector('.color__text-alpha').textContent = hexColor.slice(7).toUpperCase();

          setTooltipContent(color);
        } else {
          setTooltipContent(currentCell.dataset.previousValue);
        }

        positionTooltip(currentCell);
        showTooltip();
      });

      currentCell.addEventListener('mouseleave', hideTooltip);
    }
  }
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
