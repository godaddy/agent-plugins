export interface Money {
  amountMinor: number;
  currencyCode: string;
}

export interface Variant {
  id: string;
  sku: string;
  label: string;
  available: boolean;
  price: Money;
  compareAt?: Money;
}

export interface Product {
  id: string;
  name: string;
  kicker: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  badge?: string;
  variants: Variant[];
}

export interface CatalogPayload {
  products: Product[];
  source: "fixture" | "mcp";
  sourceLabel: string;
  checkoutMode: "demo" | "disabled";
}

export interface CartLine {
  productId: string;
  productName: string;
  imageUrl: string;
  imageAlt: string;
  variant: Variant;
  quantity: number;
}

export interface CheckoutSessionView {
  id: string;
  status: "created" | "paid" | "cancelled";
  amount: Money;
  itemCount: number;
  createdAt: string;
}
