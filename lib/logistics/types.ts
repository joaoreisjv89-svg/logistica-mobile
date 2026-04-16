export type InventoryCategory =
  | "Alimentos"
  | "Bebidas"
  | "Eletrônicos"
  | "Farmácia"
  | "Limpeza"
  | "Papelaria"
  | "Peças"
  | "Outros";

export type DeliveryStatus = "pending" | "in_route" | "delivered" | "cancelled";

export type StockMovementType = "in" | "out" | "scan_link";

export type ReportPeriod = "daily" | "weekly";

export interface ProductRecord {
  id: string;
  code: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  notes: string;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface DeliveryRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  notes: string;
  status: DeliveryStatus;
  latitude: number | null;
  longitude: number | null;
  proofPhotoUri: string | null;
  assignedProductCount: number;
  estimatedMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface DeliveryItemRecord {
  id: string;
  deliveryId: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  createdAt: string;
}

export interface InventoryMovementRecord {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  notes: string;
  deliveryId: string | null;
  createdAt: string;
}

export interface DeliveryEventRecord {
  id: string;
  deliveryId: string;
  status: DeliveryStatus;
  latitude: number | null;
  longitude: number | null;
  eventAt: string;
  notes: string;
}

export interface BackupRecord {
  id: string;
  fileUri: string;
  createdAt: string;
  type: "manual" | "automatic";
  sizeBytes: number;
}

export interface DashboardMetrics {
  deliveriesToday: number;
  productsScannedToday: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  totalProductsInStock: number;
  lowStockProducts: number;
}

export interface ReportChartPoint {
  label: string;
  value: number;
}

export interface RouteStop {
  deliveryId: string;
  customerName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  sequence: number;
  estimatedMinutes: number;
}

export interface DashboardSnapshot {
  metrics: DashboardMetrics;
  recentMovements: InventoryMovementRecord[];
  nextDeliveries: DeliveryRecord[];
  deliveryChart: ReportChartPoint[];
  inventoryChart: ReportChartPoint[];
}

export interface SearchResults {
  products: ProductRecord[];
  deliveries: DeliveryRecord[];
}

export interface ProductDraft {
  code: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  notes: string;
}

export interface DeliveryDraft {
  customerName: string;
  customerPhone: string;
  address: string;
  notes: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface StockMovementDraft {
  productId: string;
  quantity: number;
  type: StockMovementType;
  notes: string;
  deliveryId?: string | null;
}

export interface DeliveryCompletionDraft {
  deliveryId: string;
  proofPhotoUri?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string;
}

export interface ProductImportRow {
  code: string;
  name: string;
  category: string;
  quantity: number;
}

export interface AppPreferenceRecord {
  key: string;
  value: string;
}

export interface LogisticsState {
  initialized: boolean;
  syncing: boolean;
  activeThemeMode: "system" | "light" | "dark";
  scannerFastMode: boolean;
  products: ProductRecord[];
  deliveries: DeliveryRecord[];
  deliveryItems: DeliveryItemRecord[];
  movements: InventoryMovementRecord[];
  deliveryEvents: DeliveryEventRecord[];
  backups: BackupRecord[];
  dashboard: DashboardSnapshot;
  lastError: string | null;
}

export const CATEGORY_OPTIONS: InventoryCategory[] = [
  "Alimentos",
  "Bebidas",
  "Eletrônicos",
  "Farmácia",
  "Limpeza",
  "Papelaria",
  "Peças",
  "Outros",
];

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: "Pendente",
  in_route: "Em rota",
  delivered: "Entregue",
  cancelled: "Cancelada",
};

export const MOVEMENT_TYPE_LABEL: Record<StockMovementType, string> = {
  in: "Entrada",
  out: "Saída",
  scan_link: "Vinculado à entrega",
};

export const emptyDashboardSnapshot: DashboardSnapshot = {
  metrics: {
    deliveriesToday: 0,
    productsScannedToday: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    totalProductsInStock: 0,
    lowStockProducts: 0,
  },
  recentMovements: [],
  nextDeliveries: [],
  deliveryChart: [],
  inventoryChart: [],
};

export const initialLogisticsState: LogisticsState = {
  initialized: false,
  syncing: false,
  activeThemeMode: "system",
  scannerFastMode: true,
  products: [],
  deliveries: [],
  deliveryItems: [],
  movements: [],
  deliveryEvents: [],
  backups: [],
  dashboard: emptyDashboardSnapshot,
  lastError: null,
};
