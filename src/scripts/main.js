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
  const macOSVersions = window.sketchVersions.list;
  const availableSketchVersions = window.sketchVersions.available;

  const menuFragment = new DocumentFragment();
  const menuColumnFragment = new DocumentFragment();
  const menuGroupFragment = new DocumentFragment();

  for (const [macOSVersion, sketchVersions] of Object.entries(macOSVersions)) {
    menuColumnFragment.append(document.querySelector('#dropdown-column').content.cloneNode(true));

    menuColumnFragment.querySelector('.dropdown__column-heading').textContent = `macOS ${Number.parseInt(macOSVersion.slice(5)) >= 11 ? '11+' : '10'}`;

    let hideSeparator = true;

    for (const sketchVersion of availableSketchVersions) {
      // Since Sketch versions are ordered by release, "previous" comes after and "next" comes before the current item in the array.
      const previousSketchVersion = sketchVersions[sketchVersions.indexOf(sketchVersion) + 1];
      const nextAvailableSketchVersion = availableSketchVersions[availableSketchVersions.indexOf(sketchVersion) - 1];

      if (availableSketchVersions.indexOf(sketchVersion) === 0 || sketchVersion.match(/v\d+/)[0] !== nextAvailableSketchVersion?.match(/v\d+/)[0]) {
        menuColumnFragment.querySelector('.dropdown__column').append(menuGroupFragment);

        if (availableSketchVersions.indexOf(sketchVersion) > 0) {
          const separator = document.querySelector('#dropdown-separator').content.cloneNode(true);

          if (hideSeparator) {
            separator.querySelector('.dropdown__separator').classList.add('dropdown__separator--placeholder');
          }

          menuColumnFragment.querySelector('.dropdown__column').append(separator);
        }

        menuGroupFragment.append(document.querySelector('#dropdown-group').content.cloneNode(true));
      }

      let item;

      if (sketchVersions.includes(sketchVersion)) {
        item = document.querySelector('#version-dropdown-item').content.cloneNode(true);

        item.querySelector('.dropdown__item').dataset.os = macOSVersion;
        item.querySelector('.dropdown__item').dataset.version = sketchVersion;

        if (Object.keys(macOSVersions).indexOf(macOSVersion) === 0 && sketchVersions.indexOf(sketchVersion) === 0) {
          item.querySelector('.dropdown__item').classList.add('dropdown__item--active');
          const placeholders = versionsDropdown.querySelectorAll('.dropdown__placeholder')
          placeholders[0].textContent = `macOS ${Number.parseInt(macOSVersion.slice(5)) >= 11 ? '11+' : '10'}`;
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
          const previousSketchVersion = window.sketchVersions.list[macOSVersion][window.sketchVersions.list[macOSVersion].indexOf(sketchVersion) + 1];

          if (oldSelectedItem) {
            oldSelectedItem.classList.remove('dropdown__item--active');
          }

          newSelectedItem.classList.add('dropdown__item--active');

          const placeholders = versionsDropdown.querySelectorAll('.dropdown__placeholder')
          placeholders[0].textContent = `macOS ${Number.parseInt(macOSVersion.slice(5)) >= 11 ? '11+' : '10'}`;
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

          if (window.sketchDiff[macOSVersion][sketchVersion] && !window.sketchData[macOSVersion]?.[previousSketchVersion]) {
            await loadVersion(macOSVersion, previousSketchVersion)
              .then(data => {
                window.sketchData[macOSVersion][previousSketchVersion] = data;
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

        hideSeparator = sketchVersions.indexOf(sketchVersion) === sketchVersions.length - 1;
      } else {
        item = document.querySelector('#version-dropdown-item-placeholder').content.cloneNode(true);

        item.querySelector('.dropdown__item-name').textContent = sketchVersion.slice(1);
      }

      menuGroupFragment.querySelector('.dropdown__group').append(item);
    }

    menuColumnFragment.querySelector('.dropdown__column').append(menuGroupFragment);
    menuFragment.append(menuColumnFragment);
  }

  versionsDropdown.querySelector('.dropdown__menu').append(menuFragment);
}



/*
 * ========================================================
 * Prepare button groups
 * ========================================================
 */

const buttonGroups = document.querySelectorAll('.button-group');

for (const buttonGroup of buttonGroups) {
  initButtonGroup(buttonGroup);
}


/* Views button group.
 * -----------------------------------------------------------------------------
 */

for (const button of document.querySelectorAll('#views-button-group .button-group__button')) {
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


/* Changes button group.
 * -----------------------------------------------------------------------------
 */

document.querySelector('#changes-button-group .button-group__button').addEventListener('click', event => {
  if (event.target.hasAttribute('aria-pressed')) {
    document.querySelector('table').dataset.changesOnly = '';
  } else {
    delete document.querySelector('table').dataset.changesOnly;
  }
});



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

  const latestMacOSVersion = Object.keys(window.sketchVersions.list)[0];
  const latestSketchVersion = window.sketchVersions.list[latestMacOSVersion][0];
  const previousSketchVersion = window.sketchVersions.list[latestMacOSVersion][1];

  await loadVersion(latestMacOSVersion, latestSketchVersion)
    .then(data => {
      window.sketchData = {
        [latestMacOSVersion]: {
          [latestSketchVersion]: data
        }
      };
    });

  if (window.sketchDiff[latestMacOSVersion][latestSketchVersion]) {
    await loadVersion(latestMacOSVersion, previousSketchVersion)
      .then(data => {
        window.sketchData[latestMacOSVersion][previousSketchVersion] = data;
      });
  }

  colorsDropdown.querySelector('.dropdown__item[data-color="multicolour"]').classList.toggle('dropdown__item--hidden', !latestMacOSVersion.endsWith('11'));

  buildVersionsDropdownMenu();

  buildThemeHeader(latestMacOSVersion);
  buildThemeBody(latestMacOSVersion, latestSketchVersion);

  spinner.classList.add('hidden');
})();
