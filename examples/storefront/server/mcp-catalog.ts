import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Product, Variant } from "../shared/types.js";

type UnknownRecord = Record<string, unknown>;
const COMMERCE_MCP_ENDPOINT = "https://mcp.commerce.api.godaddy.com/mcp";

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function string(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, 1_000) : fallback;
}

function money(value: unknown) {
  const data = record(value);
  const amountMinor = data?.value;
  const currencyCode = string(data?.currencyCode).toUpperCase();
  if (!Number.isSafeInteger(amountMinor) || !/^[A-Z]{3}$/.test(currencyCode)) {
    return null;
  }
  return { amountMinor: amountMinor as number, currencyCode };
}

function safeMediaUrl(value: unknown): string {
  const candidate = string(value);
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" ? parsed.toString() : "/images/fallback.svg";
  } catch {
    return "/images/fallback.svg";
  }
}

function mapProduct(value: unknown): Product | null {
  const envelope = record(value);
  const data = record(envelope?.skuGroup);
  const id = string(data?.id);
  const name = string(data?.label) || string(data?.name);
  if (!id || !name || string(data?.status).toUpperCase() !== "ACTIVE") return null;

  const variants = (Array.isArray(data?.skus) ? data.skus : []).flatMap<Variant>(
    (entry) => {
      const sku = record(entry);
      const priceRows = Array.isArray(sku?.prices) ? sku.prices : [];
      const priceRow = record(priceRows[0]);
      const price = money(priceRow?.value);
      const skuId = string(sku?.id);
      if (!skuId || !price) return [];
      const compareAt = money(priceRow?.compareAtValue);
      return [
        {
          id: skuId,
          sku: string(sku?.code, skuId),
          label: string(sku?.label) || string(sku?.name, "Default"),
          available: string(sku?.status).toUpperCase() === "ACTIVE",
          price,
          ...(compareAt ? { compareAt } : {}),
        },
      ];
    },
  );

  if (variants.length === 0) return null;
  const media = Array.isArray(data?.mediaObjects) ? record(data.mediaObjects[0]) : null;
  return {
    id,
    name,
    kicker: string(data?.type, "Commerce product"),
    description: string(data?.description, "Product details are available at checkout."),
    imageUrl: safeMediaUrl(media?.url),
    imageAlt: string(media?.label, name),
    variants,
  };
}

function structured(result: unknown, operation: string): UnknownRecord {
  const data = record(record(result)?.structuredContent);
  if (!data) throw new Error(`${operation} returned no structured content.`);
  return data;
}

export interface CommerceToolClient {
  callTool(input: { name: string; arguments: Record<string, unknown> }): Promise<unknown>;
}

export async function loadProductsWithClient(
  client: CommerceToolClient,
  storeId: string,
): Promise<Product[]> {
  const discovery = structured(
    await client.callTool({
      name: "search_tools",
      arguments: {
        query: "browse active products, then get variants prices and media for a storefront",
        limit: 8,
      },
    }),
    "Tool discovery",
  );
  const discoveredSchemas = new Map(
    (Array.isArray(discovery.tools) ? discovery.tools : []).flatMap((tool) => {
      const definition = record(tool);
      const name = string(definition?.name);
      const parameters = record(definition?.parameters);
      return name && parameters ? [[name, parameters] as const] : [];
    }),
  );
  for (const required of ["catalog_sku_group_search", "catalog_sku_group_get"]) {
    if (!discoveredSchemas.has(required)) {
      throw new Error(`Commerce MCP did not discover ${required} with a parameter schema.`);
    }
  }

  const search = structured(
    await client.callTool({
      name: "execute_tool",
      arguments: {
        tool: "catalog_sku_group_search",
        arguments: { storeId, status: "ACTIVE", first: 8 },
      },
    }),
    "Product search",
  );
  const groups = Array.isArray(search.skuGroups) ? search.skuGroups : [];
  const ids = groups.map((group) => string(record(group)?.id)).filter(Boolean).slice(0, 8);

  const details = await Promise.all(
    ids.map((skuGroupId) =>
      client.callTool({
        name: "execute_tool",
        arguments: {
          tool: "catalog_sku_group_get",
          arguments: { storeId, skuGroupId, detailLevel: "full" },
        },
      }),
    ),
  );
  return details.flatMap((result) => {
    const product = mapProduct(structured(result, "Product details"));
    return product ? [product] : [];
  });
}

export async function loadProductsFromMcp(): Promise<Product[]> {
  const token = process.env.COMMERCE_MCP_TOKEN;
  const storeId = process.env.COMMERCE_STORE_ID;
  if (!token || !storeId) {
    throw new Error("MCP mode requires COMMERCE_MCP_TOKEN and COMMERCE_STORE_ID on the server.");
  }

  const client = new Client({ name: "commerce-reference-storefront", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(COMMERCE_MCP_ENDPOINT), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });

  await client.connect(transport);
  try {
    return await loadProductsWithClient(
      { callTool: (input) => client.callTool(input) },
      storeId,
    );
  } finally {
    await client.close();
  }
}
