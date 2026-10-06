const clean = (s) => String(s || '').replace(/[^A-Za-z0-9 ]/g, '').trim();
/** e.g. MBC2025_Amari Publishing_Juan dela Cruz_5728 */
export function reportFilename(ev) {
  const code = String(parseInt(String(ev._id).slice(-6), 16) % 10000).padStart(4, '0');
  return `MBC${new Date(ev.createdAt).getFullYear()}_${clean(ev.book?.publisher?.name)}_${clean(ev.evaluator?.name)}_${code}`;
}
