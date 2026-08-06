import { describe, expect, it, vi } from "vitest";
import { loadProductsWithClient, type CommerceToolClient } from "./mcp-catalog";

function result(structuredContent: unknown) {
  return { content: [], structuredContent };
}

describe("Commerce MCP catalog adapter", () => {
  it("discovers schemas before searching and maps full SKU-group data", async () => {
    const callTool = vi
      .fn<CommerceToolClient["callTool"]>()
      .mockResolvedValueOnce(
        result({
          tools: [
            { name: "catalog_sku_group_search", parameters: { type: "object" } },
            { name: "catalog_sku_group_get", parameters: { type: "object" } },
          ],
        }),
      )
      .mockResolvedValueOnce(result({ skuGroups: [{ id: "group-1", name: "Lamp" }] }))
      .mockResolvedValueOnce(
        result({
          skuGroup: {
            id: "group-1",
            name: "lamp-internal",
            label: "Field Lamp",
            description: "A useful light.",
            status: "ACTIVE",
            type: "PHYSICAL",
            mediaObjects: [{ url: "https://example.com/lamp.jpg", label: "Orange lamp" }],
            skus: [
              {
                id: "sku-1",
                code: "LAMP-ORG",
                name: "lamp-orange",
                label: "Orange",
                status: "ACTIVE",
                prices: [
                  {
                    value: { value: 6800, currencyCode: "USD" },
                    compareAtValue: { value: 7600, currencyCode: "USD" },
                  },
                ],
              },
            ],
          },
        }),
      );

    const products = await loadProductsWithClient({ callTool }, "store-1");
    expect(callTool.mock.calls[0][0].name).toBe("search_tools");
    expect(callTool.mock.calls[1][0]).toMatchObject({
      name: "execute_tool",
      arguments: {
        tool: "catalog_sku_group_search",
        arguments: { storeId: "store-1", status: "ACTIVE", first: 8 },
      },
    });
    expect(products).toEqual([
      expect.objectContaining({
        id: "group-1",
        name: "Field Lamp",
        imageUrl: "https://example.com/lamp.jpg",
        variants: [
          expect.objectContaining({
            id: "sku-1",
            sku: "LAMP-ORG",
            available: true,
            price: { amountMinor: 6800, currencyCode: "USD" },
          }),
        ],
      }),
    ]);
  });

  it("refuses to invoke catalog calls when discovery omits a required tool", async () => {
    const callTool = vi
      .fn<CommerceToolClient["callTool"]>()
      .mockResolvedValue(
        result({ tools: [{ name: "catalog_sku_group_search", parameters: {} }] }),
      );
    await expect(loadProductsWithClient({ callTool }, "store-1")).rejects.toThrow(
      "catalog_sku_group_get",
    );
    expect(callTool).toHaveBeenCalledTimes(1);
  });
});
