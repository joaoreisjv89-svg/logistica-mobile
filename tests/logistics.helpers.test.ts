import { describe, expect, it } from "vitest";

import { buildGoogleMapsUrl, filterProductsByTerm, optimizeRouteStops, validateDeliveryDraft, validateProductDraft } from "../lib/logistics/helpers";

describe("validateProductDraft", () => {
  it("accepts a complete product draft", () => {
    const result = validateProductDraft({
      code: "7891000100103",
      name: "Caixa Organizadora",
      category: "Outros",
      quantity: 12,
      notes: "Corredor A",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing fields and negative quantity", () => {
    const result = validateProductDraft({
      code: "",
      name: "",
      category: "Outros",
      quantity: -1,
      notes: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "Informe o código do produto.",
      "Informe o nome do produto.",
      "A quantidade não pode ser negativa.",
    ]);
  });
});

describe("validateDeliveryDraft", () => {
  it("requires customer, phone and address", () => {
    const result = validateDeliveryDraft({
      customerName: "",
      customerPhone: "",
      address: "",
      notes: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "Informe o nome do cliente.",
      "Informe o telefone do cliente.",
      "Informe o endereço da entrega.",
    ]);
  });
});

describe("filterProductsByTerm", () => {
  it("returns matching products by code, name, or category", () => {
    const products = [
      {
        id: "1",
        code: "7891000100103",
        name: "Caixa Organizadora",
        category: "Outros",
        quantity: 8,
        notes: "",
        createdAt: "2026-04-16T10:00:00.000Z",
        lastUpdatedAt: "2026-04-16T10:00:00.000Z",
      },
      {
        id: "2",
        code: "7891000100104",
        name: "Leitor Portátil",
        category: "Eletrônicos",
        quantity: 3,
        notes: "",
        createdAt: "2026-04-16T10:00:00.000Z",
        lastUpdatedAt: "2026-04-16T10:00:00.000Z",
      },
    ] as const;

    expect(filterProductsByTerm([...products], "0104")).toHaveLength(1);
    expect(filterProductsByTerm([...products], "leitor")[0]?.id).toBe("2");
    expect(filterProductsByTerm([...products], "eletrônicos")[0]?.id).toBe("2");
    expect(filterProductsByTerm([...products], "")).toHaveLength(2);
  });
});

describe("buildGoogleMapsUrl", () => {
  it("creates a Google Maps directions URL using the optimized stop order", () => {
    const result = buildGoogleMapsUrl([
      {
        deliveryId: "a",
        customerName: "Cliente A",
        address: "Rua A",
        latitude: -23.55,
        longitude: -46.63,
        sequence: 1,
        estimatedMinutes: 12,
      },
      {
        deliveryId: "b",
        customerName: "Cliente B",
        address: "Rua B",
        latitude: -23.56,
        longitude: -46.61,
        sequence: 2,
        estimatedMinutes: 24,
      },
      {
        deliveryId: "c",
        customerName: "Cliente C",
        address: "Rua C",
        latitude: -23.57,
        longitude: -46.60,
        sequence: 3,
        estimatedMinutes: 36,
      },
    ]);

    expect(result.optimized).toHaveLength(3);
    expect(result.url).toContain("https://www.google.com/maps/dir/?api=1");
    expect(result.url).toContain("origin=-23.55,-46.63");
    expect(result.url).toContain("destination=-23.57,-46.6");
    expect(result.url).toContain("waypoints=");
  });
});

describe("optimizeRouteStops", () => {
  it("prioritizes stops with coordinates and resequences the route", () => {
    const result = optimizeRouteStops([
      {
        deliveryId: "3",
        customerName: "Cliente Sem Coordenadas",
        address: "Rua Zeta, 90",
        latitude: null,
        longitude: null,
        sequence: 99,
        estimatedMinutes: 999,
      },
      {
        deliveryId: "2",
        customerName: "Cliente Beta",
        address: "Rua Beta, 20",
        latitude: -23.55,
        longitude: -46.63,
        sequence: 99,
        estimatedMinutes: 999,
      },
      {
        deliveryId: "1",
        customerName: "Cliente Alfa",
        address: "Rua Alfa, 10",
        latitude: -23.54,
        longitude: -46.62,
        sequence: 99,
        estimatedMinutes: 999,
      },
    ]);

    expect(result.map((stop) => stop.deliveryId)).toEqual(["1", "2", "3"]);
    expect(result.map((stop) => stop.sequence)).toEqual([1, 2, 3]);
    expect(result.map((stop) => stop.estimatedMinutes)).toEqual([12, 24, 36]);
  });
});
