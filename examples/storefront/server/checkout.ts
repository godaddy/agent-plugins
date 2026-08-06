import { randomUUID } from "node:crypto";
import type { CheckoutSessionView, Money, Product } from "../shared/types.js";

interface CheckoutInput {
  lines?: Array<{ variantId?: unknown; quantity?: unknown }>;
}

interface DemoSession extends CheckoutSessionView {
  lineIds: string[];
}

const sessions = new Map<string, DemoSession>();

export function checkoutMode(): "demo" | "disabled" {
  if (process.env.COMMERCE_DATA_MODE === "mcp") return "disabled";
  return process.env.CHECKOUT_MODE === "disabled" ? "disabled" : "demo";
}

export function createDemoSession(input: CheckoutInput, products: Product[]) {
  if (checkoutMode() !== "demo") throw new Error("Checkout is disabled in this environment.");
  if (!Array.isArray(input.lines) || input.lines.length === 0 || input.lines.length > 30) {
    throw new Error("Provide between 1 and 30 cart lines.");
  }

  const variants = new Map(products.flatMap((product) => product.variants.map((variant) => [variant.id, variant])));
  let currencyCode: string | undefined;
  let amountMinor = 0;
  let itemCount = 0;
  const lineIds: string[] = [];

  for (const line of input.lines) {
    const variantId = typeof line.variantId === "string" ? line.variantId : "";
    const quantity = line.quantity;
    const variant = variants.get(variantId);
    if (!variant || !variant.available || !Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 20) {
      throw new Error("A cart line is invalid or no longer available.");
    }
    currencyCode ??= variant.price.currencyCode;
    if (variant.price.currencyCode !== currencyCode) throw new Error("A checkout cannot combine currencies.");
    amountMinor += variant.price.amountMinor * Number(quantity);
    itemCount += Number(quantity);
    lineIds.push(variantId);
  }

  const amount: Money = { amountMinor, currencyCode: currencyCode ?? "USD" };
  const id = randomUUID();
  const session: DemoSession = {
    id,
    status: "created",
    amount,
    itemCount,
    createdAt: new Date().toISOString(),
    lineIds,
  };
  sessions.set(id, session);
  return { session, url: `/checkout/hosted?session_id=${encodeURIComponent(id)}` };
}

export function getDemoSession(id: string): DemoSession | null {
  return sessions.get(id) ?? null;
}

export function transitionDemoSession(id: string, status: "paid" | "cancelled") {
  const session = sessions.get(id);
  if (!session) return null;
  if (session.status === "created") session.status = status;
  return session;
}
