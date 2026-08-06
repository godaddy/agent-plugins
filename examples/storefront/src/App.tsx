import { useEffect, useMemo, useState } from "react";
import type {
  CartLine,
  CatalogPayload,
  CheckoutSessionView,
  Product,
  Variant,
} from "../shared/types";
import { CART_STORAGE_KEY, cartTotal, formatMoney, readCart, writeCart } from "./domain";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; catalog: CatalogPayload };

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload;
}

function useCatalog() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    jsonRequest<CatalogPayload>("/api/catalog", { signal: controller.signal })
      .then((catalog) => setState({ kind: "ready", catalog }))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ kind: "error", message: error instanceof Error ? error.message : "Catalog unavailable." });
      });
    return () => controller.abort();
  }, [attempt]);
  return { state, retry: () => setAttempt((value) => value + 1) };
}

function BrandMark() {
  return (
    <a className="brand" href="/" aria-label="Common Field Supply home">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 16 16 4l12 12-12 12L4 16Z" />
        <circle cx="16" cy="16" r="4" />
      </svg>
      <span>Common Field</span>
    </a>
  );
}

function Header({ count, onCart }: { count: number; onCart: () => void }) {
  return (
    <header className="site-header">
      <BrandMark />
      <nav aria-label="Primary">
        <a href="#objects">Objects</a>
        <a href="#field-notes">Field notes</a>
        <button className="cart-trigger" type="button" onClick={onCart} aria-label={`Open cart with ${count} items`}>
          Cart <span>{String(count).padStart(2, "0")}</span>
        </button>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">Equipment for ordinary expeditions</p>
        <h1 id="hero-title">Take the<br />long way.</h1>
        <p className="hero-deck">
          Simple, repairable objects for days that start outside and end somewhere unexpected.
        </p>
        <a className="arrow-link" href="#objects">Browse field objects <span aria-hidden="true">↘</span></a>
      </div>
      <div className="hero-art" aria-label="Abstract topographic field map" role="img">
        <span className="map-label label-a">43° 38′ N</span>
        <span className="map-label label-b">Route 08</span>
        <span className="map-label label-c">+ 642 m</span>
        <svg viewBox="0 0 720 540" aria-hidden="true">
          <path d="M-40 423C98 332 180 490 303 386s174-206 376-113 120-138 120-138" />
          <path d="M-22 469c171-109 249 52 381-70S559 180 760 318" />
          <path d="M45 540c76-115 214-31 322-114s163-176 339-84" />
          <path d="M110 0c16 145 150 136 173 259s-58 195 57 281" />
          <circle cx="490" cy="174" r="78" />
          <circle cx="490" cy="174" r="116" />
          <circle cx="490" cy="174" r="152" />
        </svg>
        <div className="hero-object">
          <img src="/images/trail-lamp.svg" alt="Orange Trail Lamp 02" />
          <span>02</span>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index, onOpen }: { product: Product; index: number; onOpen: (product: Product) => void }) {
  const price = product.variants.find((variant) => variant.available)?.price ?? product.variants[0]?.price;
  return (
    <article className={`product-card product-card-${index + 1}`}>
      <button type="button" className="product-image" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}>
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        <img src={product.imageUrl} alt={product.imageAlt} />
        <span className="product-index">{String(index + 1).padStart(2, "0")}</span>
      </button>
      <div className="product-meta">
        <div>
          <p>{product.kicker}</p>
          <h3>{product.name}</h3>
        </div>
        <div className="product-price">
          <span>{price ? formatMoney(price) : "Unavailable"}</span>
          <button type="button" onClick={() => onOpen(product)}>Explore <span aria-hidden="true">↗</span></button>
        </div>
      </div>
    </article>
  );
}

function ProductDialog({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (product: Product, variant: Variant) => void }) {
  const available = product.variants.filter((variant) => variant.available);
  const [selectedId, setSelectedId] = useState(product.variants.length === 1 && available.length === 1 ? available[0].id : "");
  const selected = product.variants.find((variant) => variant.id === selectedId);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [onClose]);

  return (
    <div className="dialog-shell" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Close product details">×</button>
        <div className="dialog-image"><img src={product.imageUrl} alt={product.imageAlt} /></div>
        <div className="dialog-copy">
          <p className="eyebrow">{product.kicker}</p>
          <h2 id="product-dialog-title">{product.name}</h2>
          <p className="dialog-description">{product.description}</p>
          <fieldset className="variant-picker">
            <legend>Choose an option</legend>
            {product.variants.map((variant) => (
              <button
                type="button"
                key={variant.id}
                className={selectedId === variant.id ? "selected" : ""}
                disabled={!variant.available}
                aria-pressed={selectedId === variant.id}
                onClick={() => setSelectedId(variant.id)}
              >
                <span>{variant.label}</span>
                <small>{variant.available ? formatMoney(variant.price) : "Unavailable"}</small>
              </button>
            ))}
          </fieldset>
          <button
            type="button"
            className="primary-button"
            disabled={!selected}
            onClick={() => selected && onAdd(product, selected)}
          >
            {selected ? `Add to cart · ${formatMoney(selected.price)}` : "Select an available option"}
          </button>
          <p className="microcopy">Server pricing and availability are checked again at checkout.</p>
        </div>
      </section>
    </div>
  );
}

function Quantity({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="quantity" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={value >= 20} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function CartDrawer({
  lines,
  open,
  checkoutMode,
  onClose,
  onQuantity,
  onRemove,
}: {
  lines: CartLine[];
  open: boolean;
  checkoutMode: "demo" | "disabled";
  onClose: () => void;
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const total = cartTotal(lines);
  const hasUnavailable = lines.some((line) => !line.variant.available);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => event.key === "Escape" && open && onClose();
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open, onClose]);

  async function checkout() {
    setCheckoutState("loading");
    setError("");
    try {
      const result = await jsonRequest<{ url: string }>("/api/checkout/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map((line) => ({ variantId: line.variant.id, quantity: line.quantity })) }),
      });
      if (!result.url.startsWith("/checkout/")) throw new Error("Checkout returned an unexpected destination.");
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start checkout.");
      setCheckoutState("error");
    }
  }

  if (!open) return null;
  return (
    <div className="drawer-shell" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-heading">
          <div><p className="eyebrow">Ready when you are</p><h2 id="cart-title">Field cart</h2></div>
          <button type="button" onClick={onClose} aria-label="Close cart">×</button>
        </div>
        {lines.length === 0 ? (
          <div className="cart-empty"><span>◇</span><h3>Room for an object or two.</h3><p>Choose a piece from the field collection to get started.</p><button type="button" onClick={onClose}>Browse objects</button></div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map((line) => (
                <article className="cart-line" key={line.variant.id}>
                  <img src={line.imageUrl} alt="" />
                  <div className="cart-line-copy">
                    <div><h3>{line.productName}</h3><p>{line.variant.label} · {line.variant.sku}</p></div>
                    <div className="cart-line-actions">
                      <Quantity value={line.quantity} onChange={(quantity) => onQuantity(line.variant.id, quantity)} />
                      <span>{formatMoney({ ...line.variant.price, amountMinor: line.variant.price.amountMinor * line.quantity })}</span>
                      <button type="button" className="remove" onClick={() => onRemove(line.variant.id)}>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <div><span>Subtotal</span><strong>{total ? formatMoney(total) : "—"}</strong></div>
              <p>Shipping and tax are calculated from server-owned data at checkout.</p>
              {hasUnavailable ? (
                <div className="demo-callout disabled"><strong>Cart changed</strong><span>Remove unavailable items before checkout.</span></div>
              ) : checkoutMode === "demo" ? (
                <div className="demo-callout"><strong>Demo checkout</strong><span>No funds will move.</span></div>
              ) : (
                <div className="demo-callout disabled"><strong>Checkout unavailable</strong><span>No approved payment-write contract is configured.</span></div>
              )}
              <button className="primary-button" type="button" disabled={hasUnavailable || checkoutMode === "disabled" || checkoutState === "loading"} onClick={checkout}>
                {checkoutState === "loading" ? "Creating secure session…" : "Continue to checkout"}
              </button>
              {error ? <p className="form-error" role="alert">{error} Try again without losing your cart.</p> : null}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function FieldNotes() {
  return (
    <section className="field-notes" id="field-notes">
      <p className="eyebrow">Field note 014</p>
      <div>
        <h2>Useful beats<br />untouchable.</h2>
        <p>We choose honest materials, visible fasteners, and forms that get better with evidence of use. Every object is meant to leave the shelf.</p>
      </div>
      <span className="note-stamp">CF<br />14</span>
    </section>
  );
}

function Storefront() {
  const { state, retry } = useCatalog();
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  useEffect(() => writeCart(cart), [cart]);
  useEffect(() => {
    if (state.kind !== "ready") return;
    const products = new Map(state.catalog.products.map((product) => [product.id, product]));
    setCart((current) =>
      current.map((line) => {
        const product = products.get(line.productId);
        const variant = product?.variants.find((candidate) => candidate.id === line.variant.id);
        if (!product || !variant) return { ...line, variant: { ...line.variant, available: false } };
        return {
          ...line,
          productName: product.name,
          imageUrl: product.imageUrl,
          imageAlt: product.imageAlt,
          variant,
        };
      }),
    );
  }, [state]);
  const itemCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  function add(product: Product, variant: Variant) {
    setCart((current) => {
      const existing = current.find((line) => line.variant.id === variant.id);
      if (existing) return current.map((line) => line.variant.id === variant.id ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line);
      return [...current, { productId: product.id, productName: product.name, imageUrl: product.imageUrl, imageAlt: product.imageAlt, variant, quantity: 1 }];
    });
    setActiveProduct(null);
    setCartOpen(true);
  }

  return (
    <>
      <Header count={itemCount} onCart={() => setCartOpen(true)} />
      <main id="main">
        <Hero />
        <section className="collection" id="objects" aria-labelledby="collection-title">
          <div className="section-heading"><div><p className="eyebrow">Field collection / 2026</p><h2 id="collection-title">Four useful objects.</h2></div><p>Designed close to home.<br />Tested farther away.</p></div>
          {state.kind === "loading" ? <div className="loading-grid" aria-label="Loading products"><i /><i /><i /><i /></div> : null}
          {state.kind === "error" ? <div className="state-panel" role="alert"><span>Connection lost</span><h3>The catalog did not make it back.</h3><p>{state.message}</p><button type="button" onClick={retry}>Try the route again</button></div> : null}
          {state.kind === "ready" ? (
            <>
              <div className={`source-banner ${state.catalog.source}`} role="status"><span>{state.catalog.source === "fixture" ? "Fixture mode" : "Connected"}</span>{state.catalog.sourceLabel}</div>
              {state.catalog.products.length === 0 ? <div className="state-panel"><span>Empty collection</span><h3>No active, purchasable products.</h3><p>Add merchandise in Commerce or change the active storefront filters.</p></div> : <div className="product-grid">{state.catalog.products.map((product, index) => <ProductCard product={product} index={index} onOpen={setActiveProduct} key={product.id} />)}</div>}
            </>
          ) : null}
        </section>
        <FieldNotes />
      </main>
      <footer><BrandMark /><p>Objects for weather, distance, and getting a little lost.</p><span>Reference storefront · 2026</span></footer>
      {activeProduct ? <ProductDialog product={activeProduct} onClose={() => setActiveProduct(null)} onAdd={add} /> : null}
      <CartDrawer
        lines={cart}
        open={cartOpen}
        checkoutMode={state.kind === "ready" ? state.catalog.checkoutMode : "disabled"}
        onClose={() => setCartOpen(false)}
        onQuantity={(id, quantity) => setCart((current) => current.map((line) => line.variant.id === id ? { ...line, quantity } : line))}
        onRemove={(id) => setCart((current) => current.filter((line) => line.variant.id !== id))}
      />
    </>
  );
}

function CheckoutFrame({ children }: { children: React.ReactNode }) {
  return <main className="checkout-page"><BrandMark /><section className="checkout-card">{children}</section><p className="checkout-foot">Fixture provider · no card details are collected</p></main>;
}

function DemoCheckout() {
  const id = new URLSearchParams(window.location.search).get("session_id") ?? "";
  const [session, setSession] = useState<CheckoutSessionView | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return setError("This checkout link has no session ID.");
    jsonRequest<{ session: CheckoutSessionView }>(`/api/checkout/sessions/${encodeURIComponent(id)}`)
      .then(({ session: result }) => setSession(result))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Session unavailable."));
  }, [id]);

  async function transition(action: "complete" | "cancel") {
    setBusy(true);
    setError("");
    try {
      const result = await jsonRequest<{ url: string }>(`/api/checkout/sessions/${encodeURIComponent(id)}/${action}`, { method: "POST" });
      window.location.assign(result.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the demo session.");
      setBusy(false);
    }
  }

  return (
    <CheckoutFrame>
      <span className="checkout-label">Simulated hosted checkout</span>
      <h1>No money moves here.</h1>
      <p>This page stands in for a provider so the redirect and verification lifecycle can be tested without credentials or financial activity.</p>
      {session ? <div className="checkout-total"><span>{session.itemCount} {session.itemCount === 1 ? "item" : "items"}</span><strong>{formatMoney(session.amount)}</strong></div> : <div className="checkout-loading">Loading server-owned session…</div>}
      <button className="primary-button" type="button" disabled={!session || busy} onClick={() => transition("complete")}>{busy ? "Updating server state…" : "Complete demo payment"}</button>
      <button className="text-button" type="button" disabled={!session || busy} onClick={() => transition("cancel")}>Cancel and keep cart</button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </CheckoutFrame>
  );
}

function ReturnPage() {
  const id = new URLSearchParams(window.location.search).get("session_id") ?? "";
  const [state, setState] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Asking the server for authoritative checkout status…");
  useEffect(() => {
    if (!id) {
      setState("error");
      setMessage("This return has no checkout session to verify.");
      return;
    }
    jsonRequest<{ session: CheckoutSessionView }>(`/api/checkout/sessions/${encodeURIComponent(id)}`)
      .then(({ session }) => {
        if (session.status === "paid") {
          localStorage.removeItem(CART_STORAGE_KEY);
          setState("paid");
          setMessage("The server verified the demo session as paid. The cart is now clear.");
        } else {
          setState("pending");
          setMessage(`The server reports ${session.status}. Your cart is preserved.`);
        }
      })
      .catch((caught) => {
        setState("error");
        setMessage(caught instanceof Error ? caught.message : "Verification failed. Your cart is preserved.");
      });
  }, [id]);

  return (
    <CheckoutFrame>
      <span className="checkout-label">Server verification</span>
      <div className={`verification-mark ${state}`} aria-hidden="true">{state === "paid" ? "✓" : state === "checking" ? "…" : "!"}</div>
      <h1>{state === "paid" ? "Verified in demo state." : state === "checking" ? "Checking the return." : "Not confirmed."}</h1>
      <p role="status">{message}</p>
      <a className="primary-button link-button" href="/">Return to the field collection</a>
    </CheckoutFrame>
  );
}

export function App() {
  if (window.location.pathname === "/checkout/hosted") return <DemoCheckout />;
  if (window.location.pathname === "/checkout/return") return <ReturnPage />;
  return <Storefront />;
}
