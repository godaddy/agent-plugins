import { afterEach, describe, expect, it } from "vitest";
import type { Product } from "../shared/types";
import { createDemoSession, getDemoSession, transitionDemoSession } from "./checkout";
import { fixtureProducts } from "./fixtures";

afterEach(() => {
  delete process.env.COMMERCE_DATA_MODE;
  delete process.env.CHECKOUT_MODE;
});

describe("demo checkout", () => {
  it("recalculates the amount from server products and ignores browser display data", () => {
    const result = createDemoSession(
      {
        lines: [
          {
            variantId: "sku-camp-cup-steel",
            quantity: 2,
            price: { amountMinor: 1, currencyCode: "USD" },
          } as never,
        ],
      },
      fixtureProducts,
    );
    expect(result.session.amount).toEqual({ amountMinor: 7200, currencyCode: "USD" });
    expect(result.session.itemCount).toBe(2);
  });

  it("requires one currency", () => {
    const mixed: Product[] = [
      fixtureProducts[0],
      {
        ...fixtureProducts[1],
        variants: fixtureProducts[1].variants.map((variant) => ({
          ...variant,
          price: { ...variant.price, currencyCode: "CAD" },
        })),
      },
    ];
    expect(() =>
      createDemoSession(
        {
          lines: [
            { variantId: "sku-field-pack-black", quantity: 1 },
            { variantId: "sku-trail-lamp-orange", quantity: 1 },
          ],
        },
        mixed,
      ),
    ).toThrow("cannot combine currencies");
  });

  it("keeps a terminal server state idempotent", () => {
    const { session } = createDemoSession(
      { lines: [{ variantId: "sku-camp-cup-steel", quantity: 1 }] },
      fixtureProducts,
    );
    expect(transitionDemoSession(session.id, "paid")?.status).toBe("paid");
    expect(transitionDemoSession(session.id, "cancelled")?.status).toBe("paid");
    expect(getDemoSession(session.id)?.status).toBe("paid");
  });

  it("disables demo checkout when live MCP data is selected", () => {
    process.env.COMMERCE_DATA_MODE = "mcp";
    expect(() =>
      createDemoSession(
        { lines: [{ variantId: "sku-camp-cup-steel", quantity: 1 }] },
        fixtureProducts,
      ),
    ).toThrow("disabled");
  });
});
