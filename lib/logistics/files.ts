import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";

import type { DeliveryRecord, InventoryCategory, LogisticsState, ProductRecord } from "@/lib/logistics/types";
import { validateProductDraft } from "@/lib/logistics/helpers";

const EXPORT_DIRECTORY = `${FileSystem.documentDirectory ?? ""}logistica-mobile/`;

function ensureExportDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Armazenamento local indisponível neste ambiente.");
  }

  return FileSystem.makeDirectoryAsync(EXPORT_DIRECTORY, { intermediates: true });
}

function sanitizeCategory(value: unknown): InventoryCategory {
  const input = String(value ?? "Outros").trim();
  const allowed: InventoryCategory[] = ["Alimentos", "Bebidas", "Eletrônicos", "Farmácia", "Limpeza", "Papelaria", "Peças", "Outros"];
  return allowed.includes(input as InventoryCategory) ? (input as InventoryCategory) : "Outros";
}

export async function pickSpreadsheetProducts() {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return [];
  }

  const file = result.assets[0];
  const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
  const workbook = XLSX.read(base64, { type: "base64" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("A planilha selecionada não possui abas utilizáveis.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });
  const importedProducts: Array<Pick<ProductRecord, "code" | "name" | "category" | "quantity" | "notes">> = [];

  for (const row of rows) {
    const draft = {
      code: String(row.code ?? row.codigo ?? row.Código ?? row.CODIGO ?? "").trim(),
      name: String(row.name ?? row.nome ?? row.Nome ?? "").trim(),
      category: sanitizeCategory(row.category ?? row.categoria ?? row.Categoria),
      quantity: Number(row.quantity ?? row.quantidade ?? row.Quantidade ?? 0),
      notes: String(row.notes ?? row.observacoes ?? row.observações ?? row.Observações ?? "").trim(),
    };

    const validation = validateProductDraft(draft);
    if (validation.valid) {
      importedProducts.push(draft);
    }
  }

  return importedProducts;
}

function createWorkbookData(products: ProductRecord[], deliveries: DeliveryRecord[]) {
  const productRows = products.map((product) => ({
    codigo: product.code,
    nome: product.name,
    categoria: product.category,
    quantidade: product.quantity,
    observacoes: product.notes,
    atualizadoEm: product.lastUpdatedAt,
  }));

  const deliveryRows = deliveries.map((delivery) => ({
    cliente: delivery.customerName,
    telefone: delivery.customerPhone,
    endereco: delivery.address,
    status: delivery.status,
    itens: delivery.assignedProductCount,
    latitude: delivery.latitude ?? "",
    longitude: delivery.longitude ?? "",
    criadoEm: delivery.createdAt,
    atualizadoEm: delivery.updatedAt,
  }));

  return { productRows, deliveryRows };
}

export async function exportOperationalWorkbook(products: ProductRecord[], deliveries: DeliveryRecord[]) {
  await ensureExportDirectory();
  const workbook = XLSX.utils.book_new();
  const { productRows, deliveryRows } = createWorkbookData(products, deliveries);

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(productRows), "Inventario");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(deliveryRows), "Entregas");

  const fileName = `relatorio-operacional-${Date.now()}.xlsx`;
  const fileUri = `${EXPORT_DIRECTORY}${fileName}`;
  const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return fileUri;
}

export async function createBackupSnapshot(snapshot: LogisticsState) {
  await ensureExportDirectory();
  const fileUri = `${EXPORT_DIRECTORY}backup-logistica-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(snapshot, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return fileUri;
}

export async function restoreBackupSnapshot() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return JSON.parse(content) as LogisticsState;
}

export async function shareLocalFile(fileUri: string, mimeType: string) {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Compartilhamento indisponível neste dispositivo.");
  }

  await Sharing.shareAsync(fileUri, {
    dialogTitle: "Compartilhar arquivo operacional",
    mimeType,
  });
}
