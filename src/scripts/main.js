import {sketchVersions, getData, mountData} from './data.js';
import * as table from './table.js';
import {initSearch} from './search.js';
import {closeDropdown, initDropdown} from './dropdown.js';
import {initButtonGroup} from './button-group.js';



const spinner = document.querySelector('.spinner');



/*
 * ========================================================
 * Build data and table.
 * ========================================================
 */

getData()
  .then(data => {
    mountData(data);

    buildVersionsDropdownMenu();

    table.buildThemeHeader();
    table.buildThemeBody();

    spinner.classList.add('hidden');
  });



/*
 * ========================================================
 * Prepare Search.
 * ========================================================
 */

const searchInput = document.querySelector('[type="search"]');

initSearch(searchInput);



/*
 * ========================================================
 * Prepare dropdowns.
 * ========================================================
 */

const dropdowns = document.querySelectorAll('.dropdown');

for (const dropdown of dropdowns) {
  initDropdown(dropdown);
}


/* Colors dropdown
 * ----------------------------
 */
const colorsDropdown = [...dropdowns].find(dropdown => dropdown.querySelector('#colors-menu'));
const colorItems = colorsDropdown.querySelectorAll('.dropdown__item');

for (const item of colorItems) {
  item.addEventListener('click', event => {
    event.preventDefault();

    const tableElement = document.querySelector('table');

    if (item.dataset.color) {
      tableElement.dataset.color = item.dataset.color;
    } else {
      delete tableElement.dataset.color;
    }

    const selectedItem = [...colorItems].find(item => item.classList.contains('dropdown__item--active'));

    if (selectedItem) {
      selectedItem.classList.remove('dropdown__item--active');
    }

    item.classList.add('dropdown__item--active');

    colorsDropdown.querySelector('.dropdown__placeholder').innerHTML = item.innerHTML;

    closeDropdown(item.closest('.dropdown'));
  });
}


/* Versions dropdown
 * ----------------------------
 */
const versionsDropdown = [...dropdowns].find(dropdown => dropdown.querySelector('#versions-menu'));

function buildVersionsDropdownMenu() {
  const reversedSketchVersions = Array.from(sketchVersions);

  reversedSketchVersions.reverse();

  const versionsMenuFragment = new DocumentFragment();
  const versionsMenuGroupFragment = new DocumentFragment();

  for (const version of reversedSketchVersions) {
    if (reversedSketchVersions.indexOf(version) === 0 || version.match(/v\d+/)[0] !== reversedSketchVersions[reversedSketchVersions.indexOf(version) - 1].match(/v\d+/)[0]) {
      versionsMenuFragment.append(versionsMenuGroupFragment);

      if (reversedSketchVersions.indexOf(version) > 0) {
        versionsMenuGroupFragment.append(document.querySelector('#dropdown-separator').content.cloneNode(true));
      }

      versionsMenuGroupFragment.append(document.querySelector('#dropdown-group').content.cloneNode(true));
    }

    const previousVersion = sketchVersions[sketchVersions.indexOf(version) - 1];
    const diff = {
      added: 0,
      changed: 0,
      removed: 0
    };

    const item = document.querySelector('#version-dropdown-item').content.cloneNode(true);

    item.querySelector('.dropdown__item').dataset.version = version;

    if (reversedSketchVersions.indexOf(version) === 0) {
      item.querySelector('.dropdown__item').classList.add('dropdown__item--active');
      versionsDropdown.querySelector('.dropdown__placeholder').textContent = version.slice(1);
    }

    item.querySelector('.dropdown__item-name').textContent = version.slice(1);

    // TODO: Handle removed variables.
    if (previousVersion) {
      for (const [variable, colors] of Object.entries(window.sketchData[version].theme)) {
        const lightColors = Object.fromEntries(Object.entries(colors).filter(color => color[0].startsWith('light')));
        const darkColors = Object.fromEntries(Object.entries(colors).filter(color => color[0].startsWith('dark')));

        const haveSameLightColor = Object.entries(lightColors).every(color => Object.values(lightColors)[0] === lightColors[color[0]]);
        const haveSameDarkColor = Object.entries(darkColors).every(color => Object.values(darkColors)[0] === darkColors[color[0]]);

        const uniqueColors = [];

        if (haveSameLightColor) {
          uniqueColors.push(Object.entries(lightColors)[0]);
        } else {
          uniqueColors.push(...Object.entries(lightColors));
        }

        if (haveSameDarkColor) {
          uniqueColors.push(Object.entries(darkColors)[0]);
        } else {
          uniqueColors.push(...Object.entries(darkColors));
        }

        for (const [themeColor, color] of uniqueColors) {
          if (window.sketchData[previousVersion]?.theme[variable]?.[themeColor]) {
            if (window.sketchData[previousVersion].theme[variable][themeColor] !== color) {
              diff.changed++;
            }
          } else {
            diff.added++;
          }
        }
      }

      for (const [property, variations] of Object.entries(window.sketchData[version].plist)) {
        for (const [mode, values] of Object.entries(variations)) {
          if (window.sketchData[previousVersion]?.plist?.[property]?.[mode]) {
            if (window.sketchData[previousVersion].plist[property][mode].value !== values.value) {
              diff.changed++;
            }
          } else {
            diff.added++;
          }
        }
      }
    }

    for (const [name, amount] of Object.entries(diff)) {
      const badge = item.querySelector(`.dropdown__badge--${name}`);

      if (amount > 0) {
        badge.textContent = amount;
      } else {
        badge.remove();
      }
    }

    if (diff.added > 0 || diff.changed > 0 || diff.removed > 0 || typeof previousVersion === 'undefined') {
      item.querySelector('.dropdown__badge--unchanged').remove();
    }

    item.querySelector('.dropdown__item').addEventListener('click', event => {
      event.preventDefault();

      const versionItems = versionsDropdown.querySelectorAll('.dropdown__item');
      const selectedItem = [...versionItems].find(item => item.classList.contains('dropdown__item--active'));

      if (selectedItem) {
        selectedItem.classList.remove('dropdown__item--active');
      }

      event.currentTarget.classList.add('dropdown__item--active');

      versionsDropdown.querySelector('.dropdown__placeholder').textContent = event.currentTarget.querySelector('.dropdown__item-name').textContent;

      closeDropdown(event.target.closest('.dropdown'));

      spinner.classList.remove('hidden');

      table.clearBody();

      if (document.querySelector('.button-group [aria-pressed="true"]').dataset.value === 'plist') {
        table.buildPlistBody();
      } else {
        table.buildThemeBody();
      }

      spinner.classList.add('hidden');
    });

    versionsMenuGroupFragment.querySelector('.dropdown__group').append(item);
  }

  versionsMenuFragment.append(versionsMenuGroupFragment);

  versionsDropdown.querySelector('.dropdown__menu').append(versionsMenuFragment);
}



/*
 * ========================================================
 * Prepare button group
 * ========================================================
 */

const buttonGroup = document.querySelector('.button-group');

initButtonGroup(buttonGroup);

for (const button of buttonGroup.querySelectorAll('.button-group__button')) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') {
      document.querySelector('[type="search"]').value = '';

      const allColorsItem = colorsDropdown.querySelector('.dropdown__item');

      if (allColorsItem.classList.contains('dropdown__item--active') === false) {
        allColorsItem.click();
      }

      colorsDropdown.querySelector('.dropdown__button').disabled = button.dataset.value !== 'theme';

      spinner.classList.remove('hidden');

      table.clearHeader();
      table.clearBody();

      if (button.dataset.value === 'plist') {
        table.buildPlistHeader();
        table.buildPlistBody();
      } else {
        table.buildThemeHeader();
        table.buildThemeBody();
      }

      spinner.classList.add('hidden');
    }
  });
}
