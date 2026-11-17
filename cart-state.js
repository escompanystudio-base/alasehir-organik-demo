export function cleanCart(rows, products) {
  const known = new Set(products.map(p => p.id));
  const merged = new Map();
  if (!Array.isArray(rows)) return [];
  for (const row of rows) {
    if (!row || !known.has(row.id) || !Number.isInteger(row.qty) || row.qty < 1 || row.qty > 99) continue;
    merged.set(row.id, Math.min(99, (merged.get(row.id) || 0) + row.qty));
  }
  return [...merged].map(([id, qty]) => ({id, qty}));
}

export function planCartAddition(cart, additions, products) {
  const next = cleanCart(cart, products);
  const requested = new Map();
  const known = new Set(products.map(p => p.id));
  if (!Array.isArray(additions) || additions.length === 0) return {ok:false, reason:'invalid', cart:next};
  for (const item of additions) {
    if (!item || !known.has(item.id) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      return {ok:false, reason:'invalid', cart:next};
    }
    requested.set(item.id, (requested.get(item.id) || 0) + item.qty);
  }
  for (const [id, qty] of requested) {
    if ((next.find(row => row.id === id)?.qty || 0) + qty > 99) return {ok:false, reason:'limit', cart:next};
  }
  for (const [id, qty] of requested) {
    const row = next.find(row => row.id === id);
    if (row) row.qty += qty;
    else next.push({id, qty});
  }
  return {ok:true, cart:next};
}
