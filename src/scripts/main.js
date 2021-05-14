import {loadVersionList, loadVersion, loadDiff} from './data.js';
import {buildThemeHeader, buildThemeBody, buildPlistHeader, buildPlistBody, clearHeader, clearBody} from './table.js';
import {initSearch} from './search.js';
import {closeDropdown, initDropdown} from './dropdown.js';
import {initButtonGroup} from './button-group.js';



const spinner = document.querySelector('.spinner');



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

function buildVersionsDropdownMenu () {
  const macOSVersions = window.sketchVersions;

  const menuFragment = new DocumentFragment();
  const menuColumnFragment = new DocumentFragment();
  const menuGroupFragment = new DocumentFragment();

  for (const [macOSVersion, sketchVersions] of Object.entries(macOSVersions)) {
    menuColumnFragment.append(document.querySelector('#dropdown-column').content.cloneNode(true));

    menuColumnFragment.querySelector('.dropdown__column-heading').textContent = `macOS ${macOSVersion.slice(5)}`;

    for (const sketchVersion of sketchVersions) {
      // Since Sketch versions are ordered by release, "previous" comes after and "next" comes before the current item in the array.
      const previousSketchVersion = sketchVersions[sketchVersions.indexOf(sketchVersion) + 1];
      const nextSketchVersion = sketchVersions[sketchVersions.indexOf(sketchVersion) - 1];

      if (sketchVersions.indexOf(sketchVersion) === 0 || sketchVersion.match(/v\d+/)[0] !== nextSketchVersion?.match(/v\d+/)[0]) {
        menuColumnFragment.querySelector('.dropdown__column').append(menuGroupFragment);

        if (sketchVersions.indexOf(sketchVersion) > 0) {
          menuColumnFragment.querySelector('.dropdown__column').append(document.querySelector('#dropdown-separator').content.cloneNode(true));
        }

        menuGroupFragment.append(document.querySelector('#dropdown-group').content.cloneNode(true));
      }

      const item = document.querySelector('#version-dropdown-item').content.cloneNode(true);

      item.querySelector('.dropdown__item').dataset.os = macOSVersion;
      item.querySelector('.dropdown__item').dataset.version = sketchVersion;

      if (Object.keys(macOSVersions).indexOf(macOSVersion) === 0 && sketchVersions.indexOf(sketchVersion) === 0) {
        item.querySelector('.dropdown__item').classList.add('dropdown__item--active');
        const placeholders = versionsDropdown.querySelectorAll('.dropdown__placeholder')
        placeholders[0].textContent = `macOS ${macOSVersion.slice(5)}`;
        placeholders[1].textContent = `Sketch ${sketchVersion.slice(1)}`;
      }

      item.querySelector('.dropdown__item-name').textContent = sketchVersion.slice(1);

      const diff = Object.assign(
        {
          added: 0,
          changed: 0,
          removed: 0
        },
        window.sketchDiff?.[macOSVersion]?.[sketchVersion]?.counters || {}
      );

      for (const [name, amount] of Object.entries(diff)) {
        const badge = item.querySelector(`.dropdown__badge--${name}`);

        if (amount > 0) {
          badge.textContent = amount;
        } else {
          badge.remove();
        }
      }

      if (diff.added > 0 || diff.changed > 0 || diff.removed > 0 || typeof previousSketchVersion === 'undefined') {
        item.querySelector('.dropdown__badge--unchanged').remove();
      }

      item.querySelector('.dropdown__item').addEventListener('click', async (event) => {
        event.preventDefault();

        const versionItems = versionsDropdown.querySelectorAll('.dropdown__item');
        const oldSelectedItem = [...versionItems].find(item => item.classList.contains('dropdown__item--active'));
        const newSelectedItem = event.currentTarget;
        const macOSVersion = newSelectedItem.dataset.os;
        const sketchVersion = newSelectedItem.dataset.version;

        if (oldSelectedItem) {
          oldSelectedItem.classList.remove('dropdown__item--active');
        }

        newSelectedItem.classList.add('dropdown__item--active');

        const placeholders = versionsDropdown.querySelectorAll('.dropdown__placeholder')
        placeholders[0].textContent = `macOS ${macOSVersion.slice(5)}`;
        placeholders[1].textContent = `Sketch ${sketchVersion.slice(1)}`;

        closeDropdown(event.target.closest('.dropdown'));

        spinner.classList.remove('hidden');

        if (!window.sketchData[macOSVersion]?.[sketchVersion]) {
          await loadVersion(macOSVersion, sketchVersion)
            .then(data => {
              if (!window.sketchData[macOSVersion]) {
                window.sketchData[macOSVersion] = {};
              }

              window.sketchData[macOSVersion][sketchVersion] = data;
            });
        }

        clearHeader();
        clearBody();

        if (document.querySelector('.button-group [aria-pressed="true"]').dataset.value === 'plist') {
          buildPlistHeader();
          buildPlistBody(macOSVersion, sketchVersion);
        } else {
          colorsDropdown.querySelector('.dropdown__item[data-color="multicolour"]').classList.toggle('dropdown__item--hidden', !macOSVersion.endsWith('11'));
          buildThemeHeader(macOSVersion);
          buildThemeBody(macOSVersion, sketchVersion);
        }

        spinner.classList.add('hidden');
      });

      menuGroupFragment.querySelector('.dropdown__group').append(item);
    }

    menuColumnFragment.querySelector('.dropdown__column').append(menuGroupFragment);
    menuFragment.append(menuColumnFragment);
  }

  versionsDropdown.querySelector('.dropdown__menu').append(menuFragment);
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
      const selectedVersionItem = versionsDropdown.querySelector('.dropdown__item--active');
      const macOSVersion = selectedVersionItem.dataset.os;
      const sketchVersion = selectedVersionItem.dataset.version;

      if (allColorsItem.classList.contains('dropdown__item--active') === false) {
        allColorsItem.click();
      }

      colorsDropdown.querySelector('.dropdown__button').disabled = button.dataset.value !== 'theme';

      spinner.classList.remove('hidden');

      clearHeader();
      clearBody();

      if (button.dataset.value === 'plist') {
        buildPlistHeader();
        buildPlistBody(macOSVersion, sketchVersion);
      } else {
        buildThemeHeader(macOSVersion);
        buildThemeBody(macOSVersion, sketchVersion);
      }

      spinner.classList.add('hidden');
    }
  });
}



/*
 * ========================================================
 * Build data and table.
 * ========================================================
 */

(async () => {
  await loadVersionList()
    .then(data => {
      window.sketchVersions = data;
    });

  await loadDiff()
    .then(data => {
      window.sketchDiff = data;
    });

  // TODO: Change index to 0.
  const latestMacOSVersion = Object.keys(window.sketchVersions)[0];
  const latestSketchVersion = window.sketchVersions[latestMacOSVersion][0];

  await loadVersion(latestMacOSVersion, latestSketchVersion)
    .then(data => {
      window.sketchData = {
        [latestMacOSVersion]: {
          [latestSketchVersion]: data
        }
      };

      colorsDropdown.querySelector('.dropdown__item[data-color="multicolour"]').classList.toggle('dropdown__item--hidden', !latestMacOSVersion.endsWith('11'));

      buildVersionsDropdownMenu();

      buildThemeHeader(latestMacOSVersion);
      buildThemeBody(latestMacOSVersion, latestSketchVersion);

      spinner.classList.add('hidden');
    });
})();
