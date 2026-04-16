import type { DeliveryDraft, ProductDraft, ProductRecord, RouteStop } from "@/lib/logistics/types";

export function buildGoogleMapsUrl(stops: RouteStop[]) {
  const optimized = optimizeRouteStops(stops).filter((stop) => stop.latitude != null && stop.longitude != null);

  if (optimized.length === 0) {
    throw new Error("Nenhuma entrega com coordenadas disponíveis para navegação.");
  }

  const origin = `${optimized[0].latitude},${optimized[0].longitude}`;
  const destination = `${optimized[optimized.length - 1].latitude},${optimized[optimized.length - 1].longitude}`;
  const waypointStops = optimized.slice(1, -1).map((stop) => `${stop.latitude},${stop.longitude}`).join("|");

  const url = waypointStops
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&waypoints=${encodeURIComponent(waypointStops)}`
    : `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

  return {
    optimized,
    url,
  };
}

export function validateProductDraft(draft: ProductDraft) {
  const errors: string[] = [];

  if (!draft.code.trim()) {
    errors.push("Informe o código do produto.");
  }

  if (!draft.name.trim()) {
    errors.push("Informe o nome do produto.");
  }

  if (draft.quantity < 0) {
    errors.push("A quantidade não pode ser negativa.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDeliveryDraft(draft: DeliveryDraft) {
  const errors: string[] = [];

  if (!draft.customerName.trim()) {
    errors.push("Informe o nome do cliente.");
  }

  if (!draft.customerPhone.trim()) {
    errors.push("Informe o telefone do cliente.");
  }

  if (!draft.address.trim()) {
    errors.push("Informe o endereço da entrega.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function scoreStop(stop: RouteStop) {
  const hasCoordinates = stop.latitude != null && stop.longitude != null;
  const alphabeticalWeight = stop.address.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return {
    hasCoordinates,
    alphabeticalWeight,
  };
}

export function optimizeRouteStops(stops: RouteStop[]) {
  const ordered = [...stops].sort((left, right) => {
    const leftScore = scoreStop(left);
    const rightScore = scoreStop(right);

    if (leftScore.hasCoordinates !== rightScore.hasCoordinates) {
      return leftScore.hasCoordinates ? -1 : 1;
    }

    return leftScore.alphabeticalWeight.localeCompare(rightScore.alphabeticalWeight, "pt-BR");
  });

  return ordered.map((stop, index) => ({
    ...stop,
    sequence: index + 1,
    estimatedMinutes: (index + 1) * 12,
  }));
}

export function filterProductsByTerm(products: ProductRecord[], term: string) {
  const normalized = term.trim().toLowerCase();

  if (!normalized) {
    return products;
  }

  return products.filter((product) =>
    [product.code, product.name, product.category].some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function formatCompactDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
