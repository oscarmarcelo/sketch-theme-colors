/*
 * ========================================================
 * Initiate dropdown.
 * ========================================================
 */

export function initDropdown(dropdown) {
  const button = dropdown.querySelector('.dropdown__button');

  button.addEventListener('click', () => {
    if (dropdown.classList.contains('dropdown--active')) {
      closeDropdown(dropdown);
    } else {
      openDropdown(dropdown);
    }
  });
}



/*
 * ========================================================
 * Open dropdown.
 * ========================================================
 */

export function openDropdown(dropdown) {
  dropdown.classList.add('dropdown--active');
  dropdown.querySelector('.dropdown__button').setAttribute('aria-expanded', 'true');

  ['mousedown', 'blur', 'resize', 'keydown'].forEach(eventName => {
    window.addEventListener(eventName, maybeCloseDropdown);
  });
}



/*
 * ========================================================
 * Close dropdown.
 * ========================================================
 */

export function closeDropdown(dropdown) {
  dropdown.classList.remove('dropdown--active');
  dropdown.querySelector('.dropdown__button').removeAttribute('aria-expanded');

  ['mousedown', 'blur', 'resize', 'keydown'].forEach(eventName => {
    window.removeEventListener(eventName, maybeCloseDropdown);
  });
}



/*
 * ========================================================
 * Close dropdown if user actions are outside of context.
 * ========================================================
 */

function maybeCloseDropdown(event) {
  if (
    event.target.nodeType !== Node.ELEMENT_NODE ||
    (
      event.target.classList.contains('dropdown--active') === false &&
      event.target.closest('.dropdown--active') === null
    )
  ) {
    const dropdown = document.querySelector('.dropdown--active');

    if (dropdown) {
      closeDropdown(dropdown.closest('.dropdown'));
    }
  }
}
