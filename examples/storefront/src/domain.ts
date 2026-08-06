import type { CartLine, Money } from "../shared/types";

export const CART_STORAGE_KEY = "common-field-cart:v1";

export function formatMoney(money: Money): string {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: money.currencyCode,
  });
  const exponent = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(money.amountMinor / 10 ** exponent);
}

export function cartTotal(lines: CartLine[]): Money | null {
  if (lines.length === 0) return null;
  const currencyCode = lines[0].variant.price.currencyCode;
  let amountMinor = 0;
  for (const line of lines) {
    if (line.variant.price.currencyCode !== currencyCode) {
      throw new Error("Cart contains more than one currency.");
    }
    amountMinor += line.variant.price.amountMinor * line.quantity;
  }
  return { amountMinor, currencyCode };
}

export function readCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    const payload = parsed as { version?: unknown; lines?: unknown };
    if (payload.version !== 1 || !Array.isArray(payload.lines)) return [];
    return payload.lines.filter((line): line is CartLine => {
      if (!line || typeof line !== "object" || Array.isArray(line)) return false;
      const value = line as Partial<CartLine>;
      return (
        typeof value.productId === "string" &&
        typeof value.productName === "string" &&
        typeof value.imageUrl === "string" &&
        typeof value.imageAlt === "string" &&
        typeof value.quantity === "number" &&
        Number.isSafeInteger(value.quantity) &&
        value.quantity >= 1 &&
        value.quantity <= 20 &&
        !!value.variant &&
        typeof value.variant.id === "string" &&
        typeof value.variant.price?.amountMinor === "number" &&
        typeof value.variant.price?.currencyCode === "string"
      );
    });
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, lines }));
}
