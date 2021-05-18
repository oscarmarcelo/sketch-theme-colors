/*
 * ========================================================
 * Initiate Button Group
 * ========================================================
 */

export function initButtonGroup(group) {
  const buttons = group.querySelectorAll('.button-group__button');

  for (const button of buttons) {
    button.addEventListener('click', () => {
      if ([...buttons].length  === 1) {
        if (button.hasAttribute('aria-pressed')) {
          button.removeAttribute('aria-pressed');
        } else {
          button.setAttribute('aria-pressed', 'true');
        }
      } else {
        if (button.getAttribute('aria-pressed') !== 'true') {
          [...buttons].find(pressedButton => pressedButton.getAttribute('aria-pressed')).removeAttribute('aria-pressed');

          button.setAttribute('aria-pressed', 'true');
        }
      }
    });
  }
}
