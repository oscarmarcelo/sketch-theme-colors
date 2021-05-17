const tooltip = document.querySelector('.tooltip');
const tooltipBody = tooltip.querySelector('.tooltip__body');



/*
 * =============================================================================
 * Update tooltip content.
 * =============================================================================
 */

export function setTooltipContent (content) {
  if (content.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    tooltipBody.innerHTML = '';
    tooltipBody.append(content);
  } else {
    tooltipBody.innerHTML = content;
  }
}



/*
 * =============================================================================
 * Set position of tooltip.
 * =============================================================================
 */

export function positionTooltip (anchor) {
  const offsetParent = anchor.offsetParent;

  Object.assign(tooltip.style, {
    width: `${anchor.offsetWidth}px`,
    top: `${offsetParent.offsetTop + anchor.offsetTop - tooltip.offsetHeight}px`,
    left: `${offsetParent.offsetLeft + anchor.offsetLeft + anchor.offsetWidth / 2}px`
  });
}



/*
 * =============================================================================
 * Show Tooltip.
 * =============================================================================
 */

export function showTooltip () {
  tooltip.classList.add('tooltip--active');
}



/*
 * =============================================================================
 * Hide Tooltip.
 * =============================================================================
 */

export function hideTooltip () {
  tooltip.classList.remove('tooltip--active');

  Object.assign(tooltip.style, {
    width: '',
    top: '',
    left: ''
  });
}
