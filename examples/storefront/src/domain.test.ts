import { describe, expect, it } from "vitest";
import type { CartLine } from "../shared/types";
import { cartTotal, formatMoney } from "./domain";

function line(currencyCode: string, amountMinor: number, quantity: number): CartLine {
  return {
    productId: "product",
    productName: "Product",
    imageUrl: "/image.svg",
    imageAlt: "Product",
    quantity,
    variant: {
      id: `variant-${currencyCode}`,
      sku: "SKU",
      label: "Variant",
      available: true,
      price: { amountMinor, currencyCode },
    },
  };
}

describe("money", () => {
  it("formats currencies using their minor-unit exponent", () => {
    expect(formatMoney({ amountMinor: 1234, currencyCode: "USD" })).toContain("12.34");
    expect(formatMoney({ amountMinor: 1234, currencyCode: "JPY" })).toContain("1,234");
  });

  it("totals quantities while retaining currency", () => {
    expect(cartTotal([line("USD", 1200, 2), line("USD", 500, 1)])).toEqual({
      amountMinor: 2900,
      currencyCode: "USD",
    });
  });

  it("rejects mixed currencies", () => {
    expect(() => cartTotal([line("USD", 1200, 1), line("CAD", 500, 1)])).toThrow(
      "more than one currency",
    );
  });
});
