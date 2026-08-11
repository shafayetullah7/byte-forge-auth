export function computeCartTotals(
  items: { price: string; quantity: number }[],
): { totalQuantity: number; subtotal: string } {
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0,
  );
  return {
    totalQuantity,
    subtotal: subtotal.toFixed(2),
  };
}
