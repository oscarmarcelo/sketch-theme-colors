/*
 * ========================================================
 * Search
 * ========================================================
 */

export function initSearch(input) {
  input.addEventListener('input', () => {
    const rows = document.querySelectorAll('tbody tr');

    for (const row of rows) {
      if (input.value.length > 0) {
        const visibleCells = [...row.querySelectorAll('th, td')].filter(cell => getComputedStyle(cell).display !== 'none');

        let hasSearchResult = false;

        if (visibleCells.length > 0) {
          hasSearchResult = [...visibleCells].some(cell => cell.textContent.toLowerCase().includes(input.value.toLowerCase()));
        }

        row.classList.toggle('hidden', !hasSearchResult);
      } else {
        row.classList.remove('hidden');
      }
    }
  });
}
