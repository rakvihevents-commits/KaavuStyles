// The database continues to store the detail URL. New uploads save a card
// image beside it with the same unique name; older URLs remain unchanged.
export function productCardUrl(detailUrl: string): string {
  return detailUrl.replace(/-detail\.webp(?=\?|#|$)/, "-card.webp");
}
