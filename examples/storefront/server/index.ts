import express from "express";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkoutMode, createDemoSession, getDemoSession, transitionDemoSession } from "./checkout.js";
import { fixtureProducts } from "./fixtures.js";
import { loadProductsFromMcp } from "./mcp-catalog.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);
const sourceMode = process.env.COMMERCE_DATA_MODE === "mcp" ? "mcp" : "fixture";

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/api/catalog", async (_request, response) => {
  try {
    const products = sourceMode === "mcp" ? await loadProductsFromMcp() : fixtureProducts;
    response.json({
      products,
      source: sourceMode,
      sourceLabel:
        sourceMode === "mcp"
          ? "Live Commerce MCP catalog"
          : "Fixture catalog — no live commerce data",
      checkoutMode: checkoutMode(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog unavailable.";
    response.status(502).json({ error: message, source: sourceMode });
  }
});

app.post("/api/checkout/sessions", (request, response) => {
  try {
    const result = createDemoSession(request.body, fixtureProducts);
    response.status(201).json({ url: result.url, sessionId: result.session.id });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Unable to create checkout." });
  }
});

app.get("/api/checkout/sessions/:id", (request, response) => {
  const session = getDemoSession(request.params.id);
  if (!session) return response.status(404).json({ error: "Checkout session not found." });
  return response.json({ session });
});

app.post("/api/checkout/sessions/:id/:action", (request, response) => {
  if (request.params.action !== "complete" && request.params.action !== "cancel") {
    return response.status(404).json({ error: "Unknown checkout action." });
  }
  const status = request.params.action === "complete" ? "paid" : "cancelled";
  const session = transitionDemoSession(request.params.id, status);
  if (!session) return response.status(404).json({ error: "Checkout session not found." });
  const path = status === "paid" ? "/checkout/return" : "/";
  return response.json({ url: `${path}?session_id=${encodeURIComponent(session.id)}` });
});

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "..", "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.use((request, response, next) => {
    if (request.method !== "GET" || request.path.startsWith("/api/")) return next();
    return response.sendFile(join(dist, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Storefront API listening on http://localhost:${port} (${sourceMode} catalog, ${checkoutMode()} checkout)`);
});
