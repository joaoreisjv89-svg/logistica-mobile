import * as SQLite from "expo-sqlite";

import {
  emptyDashboardSnapshot,
  type BackupRecord,
  type DashboardSnapshot,
  type DeliveryCompletionDraft,
  type DeliveryDraft,
  type DeliveryEventRecord,
  type DeliveryItemRecord,
  type DeliveryRecord,
  type InventoryMovementRecord,
  type ProductDraft,
  type ProductRecord,
  type RouteStop,
  type SearchResults,
  type StockMovementDraft,
} from "@/lib/logistics/types";

const DATABASE_NAME = "logistica-mobile.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function startOfTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  const db = await databasePromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      last_updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      proof_photo_uri TEXT,
      assigned_product_count INTEGER NOT NULL DEFAULT 0,
      estimated_minutes INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS delivery_items (
      id TEXT PRIMARY KEY NOT NULL,
      delivery_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY NOT NULL,
      product_id TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      delivery_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_events (
      id TEXT PRIMARY KEY NOT NULL,
      delivery_id TEXT NOT NULL,
      status TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      event_at TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY NOT NULL,
      file_uri TEXT NOT NULL,
      created_at TEXT NOT NULL,
      type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS app_preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
    CREATE INDEX IF NOT EXISTS idx_deliveries_customer_name ON deliveries(customer_name);
    CREATE INDEX IF NOT EXISTS idx_deliveries_address ON deliveries(address);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at);
    CREATE INDEX IF NOT EXISTS idx_delivery_events_event_at ON delivery_events(event_at);
  `);

  return db;
}

function mapProduct(row: Record<string, unknown>): ProductRecord {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    category: String(row.category) as ProductRecord["category"],
    quantity: Number(row.quantity),
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at),
    lastUpdatedAt: String(row.last_updated_at),
  };
}

function mapDelivery(row: Record<string, unknown>): DeliveryRecord {
  return {
    id: String(row.id),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    address: String(row.address),
    notes: String(row.notes ?? ""),
    status: String(row.status) as DeliveryRecord["status"],
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    proofPhotoUri: row.proof_photo_uri == null ? null : String(row.proof_photo_uri),
    assignedProductCount: Number(row.assigned_product_count ?? 0),
    estimatedMinutes: row.estimated_minutes == null ? null : Number(row.estimated_minutes),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
  };
}

function mapDeliveryItem(row: Record<string, unknown>): DeliveryItemRecord {
  return {
    id: String(row.id),
    deliveryId: String(row.delivery_id),
    productId: String(row.product_id),
    productCode: String(row.product_code),
    productName: String(row.product_name),
    quantity: Number(row.quantity),
    createdAt: String(row.created_at),
  };
}

function mapMovement(row: Record<string, unknown>): InventoryMovementRecord {
  return {
    id: String(row.id),
    productId: String(row.product_id),
    productCode: String(row.product_code),
    productName: String(row.product_name),
    type: String(row.type) as InventoryMovementRecord["type"],
    quantity: Number(row.quantity),
    notes: String(row.notes ?? ""),
    deliveryId: row.delivery_id == null ? null : String(row.delivery_id),
    createdAt: String(row.created_at),
  };
}

function mapDeliveryEvent(row: Record<string, unknown>): DeliveryEventRecord {
  return {
    id: String(row.id),
    deliveryId: String(row.delivery_id),
    status: String(row.status) as DeliveryEventRecord["status"],
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    eventAt: String(row.event_at),
    notes: String(row.notes ?? ""),
  };
}

function mapBackup(row: Record<string, unknown>): BackupRecord {
  return {
    id: String(row.id),
    fileUri: String(row.file_uri),
    createdAt: String(row.created_at),
    type: String(row.type) as BackupRecord["type"],
    sizeBytes: Number(row.size_bytes ?? 0),
  };
}

async function getProducts() {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM products ORDER BY name COLLATE NOCASE ASC");
  return rows.map((row) => mapProduct(row as Record<string, unknown>));
}

async function getDeliveries() {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM deliveries ORDER BY updated_at DESC");
  return rows.map((row) => mapDelivery(row as Record<string, unknown>));
}

async function getDeliveryItems() {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM delivery_items ORDER BY created_at DESC");
  return rows.map((row) => mapDeliveryItem(row as Record<string, unknown>));
}

async function getMovements() {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 50");
  return rows.map((row) => mapMovement(row as Record<string, unknown>));
}

async function getDeliveryEvents() {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM delivery_events ORDER BY event_at DESC LIMIT 100");
  return rows.map((row) => mapDeliveryEvent(row as Record<string, unknown>));
}

async function getBackups() {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM backups ORDER BY created_at DESC");
  return rows.map((row) => mapBackup(row as Record<string, unknown>));
}

async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const db = await getDatabase();
  const today = startOfTodayIso();

  const [deliveriesTodayRow, pendingRow, completedRow, stockRow, lowStockRow, scannedRow] = await Promise.all([
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM deliveries WHERE created_at >= ?", [today]),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM deliveries WHERE status = 'pending'"),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM deliveries WHERE status = 'delivered'"),
    db.getFirstAsync<{ total: number }>("SELECT COALESCE(SUM(quantity), 0) as total FROM products"),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE quantity <= 5"),
    db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM inventory_movements WHERE created_at >= ? AND type IN ('in','out','scan_link')",
      [today],
    ),
  ]);

  const recentMovements = await getMovements();
  const nextDeliveriesRows = await db.getAllAsync(
    "SELECT * FROM deliveries WHERE status IN ('pending', 'in_route') ORDER BY updated_at DESC LIMIT 5",
  );

  const deliveryChartRows = await db.getAllAsync<{ label: string; value: number }>(`
    SELECT substr(created_at, 1, 10) as label, COUNT(*) as value
    FROM deliveries
    GROUP BY substr(created_at, 1, 10)
    ORDER BY label DESC
    LIMIT 7
  `);

  const inventoryChartRows = await db.getAllAsync<{ label: string; value: number }>(`
    SELECT substr(created_at, 1, 10) as label, SUM(quantity) as value
    FROM inventory_movements
    GROUP BY substr(created_at, 1, 10)
    ORDER BY label DESC
    LIMIT 7
  `);

  return {
    metrics: {
      deliveriesToday: Number(deliveriesTodayRow?.count ?? 0),
      productsScannedToday: Number(scannedRow?.count ?? 0),
      pendingDeliveries: Number(pendingRow?.count ?? 0),
      completedDeliveries: Number(completedRow?.count ?? 0),
      totalProductsInStock: Number(stockRow?.total ?? 0),
      lowStockProducts: Number(lowStockRow?.count ?? 0),
    },
    recentMovements,
    nextDeliveries: nextDeliveriesRows.map((row) => mapDelivery(row as Record<string, unknown>)),
    deliveryChart: deliveryChartRows.reverse(),
    inventoryChart: inventoryChartRows
      .map((row) => ({ label: row.label, value: Number(row.value ?? 0) }))
      .reverse(),
  };
}

export async function initializeLogisticsDatabase() {
  await getDatabase();
  return loadAppSnapshot();
}

export async function loadAppSnapshot() {
  const [products, deliveries, deliveryItems, movements, deliveryEvents, backups, dashboard] = await Promise.all([
    getProducts(),
    getDeliveries(),
    getDeliveryItems(),
    getMovements(),
    getDeliveryEvents(),
    getBackups(),
    getDashboardSnapshot(),
  ]);

  return {
    products,
    deliveries,
    deliveryItems,
    movements,
    deliveryEvents,
    backups,
    dashboard: dashboard ?? emptyDashboardSnapshot,
  };
}

export async function upsertProduct(draft: ProductDraft) {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>("SELECT id FROM products WHERE code = ?", [draft.code.trim()]);
  const now = new Date().toISOString();

  if (existing?.id) {
    await db.runAsync(
      `UPDATE products
       SET name = ?, category = ?, quantity = ?, notes = ?, last_updated_at = ?
       WHERE id = ?`,
      [draft.name.trim(), draft.category, draft.quantity, draft.notes.trim(), now, existing.id],
    );
    return existing.id;
  }

  const id = makeId("prd");
  await db.runAsync(
    `INSERT INTO products (id, code, name, category, quantity, notes, created_at, last_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, draft.code.trim(), draft.name.trim(), draft.category, draft.quantity, draft.notes.trim(), now, now],
  );
  return id;
}

export async function deleteProduct(productId: string) {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM products WHERE id = ?", [productId]);
}

export async function searchAll(term: string): Promise<SearchResults> {
  const db = await getDatabase();
  const normalizedTerm = `%${term.trim()}%`;
  const [productRows, deliveryRows] = await Promise.all([
    db.getAllAsync(
      `SELECT * FROM products
       WHERE code LIKE ? OR name LIKE ? OR category LIKE ?
       ORDER BY name COLLATE NOCASE ASC`,
      [normalizedTerm, normalizedTerm, normalizedTerm],
    ),
    db.getAllAsync(
      `SELECT * FROM deliveries
       WHERE customer_name LIKE ? OR address LIKE ?
       ORDER BY updated_at DESC`,
      [normalizedTerm, normalizedTerm],
    ),
  ]);

  return {
    products: productRows.map((row) => mapProduct(row as Record<string, unknown>)),
    deliveries: deliveryRows.map((row) => mapDelivery(row as Record<string, unknown>)),
  };
}

export async function createDelivery(draft: DeliveryDraft) {
  const db = await getDatabase();
  const id = makeId("dlv");
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO deliveries (
      id, customer_name, customer_phone, address, notes, status, latitude, longitude,
      proof_photo_uri, assigned_product_count, estimated_minutes, created_at, updated_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NULL, 0, NULL, ?, ?, NULL)`,
    [
      id,
      draft.customerName.trim(),
      draft.customerPhone.trim(),
      draft.address.trim(),
      draft.notes.trim(),
      draft.latitude ?? null,
      draft.longitude ?? null,
      now,
      now,
    ],
  );

  await addDeliveryEvent({
    deliveryId: id,
    status: "pending",
    latitude: draft.latitude ?? null,
    longitude: draft.longitude ?? null,
    notes: "Entrega criada",
  });

  return id;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryRecord["status"],
  latitude: number | null = null,
  longitude: number | null = null,
  notes = "",
) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const completedAt = status === "delivered" ? now : null;
  await db.runAsync(
    `UPDATE deliveries
     SET status = ?, latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), updated_at = ?, completed_at = COALESCE(?, completed_at)
     WHERE id = ?`,
    [status, latitude, longitude, now, completedAt, deliveryId],
  );

  await addDeliveryEvent({ deliveryId, status, latitude, longitude, notes });
}

export async function completeDelivery(draft: DeliveryCompletionDraft) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE deliveries
     SET status = 'delivered', proof_photo_uri = ?, latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), updated_at = ?, completed_at = ?
     WHERE id = ?`,
    [draft.proofPhotoUri ?? null, draft.latitude ?? null, draft.longitude ?? null, now, now, draft.deliveryId],
  );

  await addDeliveryEvent({
    deliveryId: draft.deliveryId,
    status: "delivered",
    latitude: draft.latitude ?? null,
    longitude: draft.longitude ?? null,
    notes: draft.notes ?? "Entrega concluída",
  });
}

export async function assignProductToDelivery(deliveryId: string, productId: string, quantity: number) {
  const db = await getDatabase();
  const product = await db.getFirstAsync<{ id: string; code: string; name: string }>(
    "SELECT id, code, name FROM products WHERE id = ?",
    [productId],
  );

  if (!product) {
    throw new Error("Produto não encontrado para vincular à entrega.");
  }

  const itemId = makeId("itm");
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO delivery_items (id, delivery_id, product_id, product_code, product_name, quantity, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [itemId, deliveryId, productId, product.code, product.name, quantity, createdAt],
  );

  await db.runAsync(
    `UPDATE deliveries
     SET assigned_product_count = (
      SELECT COALESCE(SUM(quantity), 0) FROM delivery_items WHERE delivery_id = ?
     ), updated_at = ?
     WHERE id = ?`,
    [deliveryId, createdAt, deliveryId],
  );

  await registerStockMovement({
    productId,
    quantity,
    type: "scan_link",
    notes: "Produto vinculado à entrega",
    deliveryId,
  });
}

export async function registerStockMovement(draft: StockMovementDraft) {
  const db = await getDatabase();
  const product = await db.getFirstAsync<{ id: string; code: string; name: string; quantity: number }>(
    "SELECT id, code, name, quantity FROM products WHERE id = ?",
    [draft.productId],
  );

  if (!product) {
    throw new Error("Produto não encontrado.");
  }

  const nextQuantity = draft.type === "out" ? Number(product.quantity) - draft.quantity : Number(product.quantity) + draft.quantity;

  if (nextQuantity < 0) {
    throw new Error("A operação deixaria o estoque negativo.");
  }

  const movementId = makeId("mov");
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO inventory_movements (id, product_id, product_code, product_name, type, quantity, notes, delivery_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [movementId, draft.productId, product.code, product.name, draft.type, draft.quantity, draft.notes.trim(), draft.deliveryId ?? null, now],
  );

  await db.runAsync(
    `UPDATE products
     SET quantity = ?, last_updated_at = ?
     WHERE id = ?`,
    [nextQuantity, now, draft.productId],
  );

  return movementId;
}

async function addDeliveryEvent({
  deliveryId,
  status,
  latitude,
  longitude,
  notes,
}: {
  deliveryId: string;
  status: DeliveryRecord["status"];
  latitude: number | null;
  longitude: number | null;
  notes: string;
}) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO delivery_events (id, delivery_id, status, latitude, longitude, event_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [makeId("evt"), deliveryId, status, latitude, longitude, new Date().toISOString(), notes.trim()],
  );
}

export async function recordBackup(fileUri: string, type: BackupRecord["type"], sizeBytes: number) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO backups (id, file_uri, created_at, type, size_bytes)
     VALUES (?, ?, ?, ?, ?)`,
    [makeId("bkp"), fileUri, new Date().toISOString(), type, sizeBytes],
  );
}

export async function listPendingRouteStops(): Promise<RouteStop[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    customer_name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  }>(`SELECT id, customer_name, address, latitude, longitude
      FROM deliveries
      WHERE status IN ('pending', 'in_route')
      ORDER BY created_at ASC`);

  return rows.map((row, index) => ({
    deliveryId: row.id,
    customerName: row.customer_name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    sequence: index + 1,
    estimatedMinutes: (index + 1) * 12,
  }));
}
