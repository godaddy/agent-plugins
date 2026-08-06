import type { Product } from "../shared/types.js";

export const fixtureProducts: Product[] = [
  {
    id: "product-field-pack",
    name: "Field Pack 24",
    kicker: "Carry / 24 litre",
    description:
      "A low-profile day pack with a wide clamshell opening, weatherproof base, and just enough structure for the long way home.",
    imageUrl: "/images/field-pack.svg",
    imageAlt: "Black field pack standing against a warm yellow backdrop",
    badge: "Field tested",
    variants: [
      {
        id: "sku-field-pack-black",
        sku: "FP24-BLK",
        label: "Ridge black",
        available: true,
        price: { amountMinor: 12800, currencyCode: "USD" },
      },
      {
        id: "sku-field-pack-clay",
        sku: "FP24-CLY",
        label: "Red clay",
        available: true,
        price: { amountMinor: 12800, currencyCode: "USD" },
      },
      {
        id: "sku-field-pack-moss",
        sku: "FP24-MOS",
        label: "Dry moss",
        available: false,
        price: { amountMinor: 12800, currencyCode: "USD" },
      },
    ],
  },
  {
    id: "product-trail-lamp",
    name: "Trail Lamp 02",
    kicker: "Light / 220 lumens",
    description:
      "A repairable pocket lamp with a warm low mode, a weather-sealed dial, and a magnetic back for camp kitchens and late arrivals.",
    imageUrl: "/images/trail-lamp.svg",
    imageAlt: "Compact orange trail lamp casting a pool of light",
    badge: "New object",
    variants: [
      {
        id: "sku-trail-lamp-orange",
        sku: "TL02-ORG",
        label: "Signal orange",
        available: true,
        price: { amountMinor: 6800, currencyCode: "USD" },
        compareAt: { amountMinor: 7600, currencyCode: "USD" },
      },
    ],
  },
  {
    id: "product-ground-cloth",
    name: "Ground Cloth 03",
    kicker: "Shelter / 3 person",
    description:
      "A hard-wearing picnic and tent cloth that folds into its own corner pocket. Brass eyelets make it useful when the forecast changes.",
    imageUrl: "/images/ground-cloth.svg",
    imageAlt: "Blue ground cloth folded into a geometric square",
    variants: [
      {
        id: "sku-ground-cloth-blue",
        sku: "GC03-BLU",
        label: "Harbour blue",
        available: true,
        price: { amountMinor: 9200, currencyCode: "USD" },
      },
      {
        id: "sku-ground-cloth-sand",
        sku: "GC03-SND",
        label: "Quarry sand",
        available: true,
        price: { amountMinor: 9200, currencyCode: "USD" },
      },
    ],
  },
  {
    id: "product-camp-cup",
    name: "Camp Cup 08",
    kicker: "Table / 12 ounce",
    description:
      "A double-wall steel cup with a broad handle, ceramic-feel rim, and a base that stays planted on uneven tables.",
    imageUrl: "/images/camp-cup.svg",
    imageAlt: "Steel camp cup with a blue handle on a cream backdrop",
    variants: [
      {
        id: "sku-camp-cup-steel",
        sku: "CC08-STL",
        label: "Brushed steel",
        available: true,
        price: { amountMinor: 3600, currencyCode: "USD" },
      },
    ],
  },
];
