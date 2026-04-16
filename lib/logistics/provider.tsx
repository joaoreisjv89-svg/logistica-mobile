import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  assignProductToDelivery,
  completeDelivery,
  createDelivery,
  deleteProduct,
  initializeLogisticsDatabase,
  listPendingRouteStops,
  loadAppSnapshot,
  registerStockMovement,
  searchAll,
  upsertProduct,
  updateDeliveryStatus,
} from "@/lib/logistics/database";
import {
  createBackupSnapshot,
  exportOperationalWorkbook,
  pickSpreadsheetProducts,
  restoreBackupSnapshot,
  shareLocalFile,
} from "@/lib/logistics/files";
import {
  initialLogisticsState,
  type DeliveryCompletionDraft,
  type DeliveryDraft,
  type LogisticsState,
  type ProductDraft,
  type SearchResults,
  type StockMovementDraft,
} from "@/lib/logistics/types";

interface LogisticsContextValue {
  state: LogisticsState;
  refresh: () => Promise<void>;
  saveProduct: (draft: ProductDraft) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  addDelivery: (draft: DeliveryDraft) => Promise<void>;
  changeDeliveryStatus: (
    deliveryId: string,
    status: LogisticsState["deliveries"][number]["status"],
    latitude?: number | null,
    longitude?: number | null,
    notes?: string,
  ) => Promise<void>;
  finalizeDelivery: (draft: DeliveryCompletionDraft) => Promise<void>;
  moveStock: (draft: StockMovementDraft) => Promise<void>;
  connectProductToDelivery: (deliveryId: string, productId: string, quantity: number) => Promise<void>;
  runSearch: (term: string) => Promise<SearchResults>;
  optimizeRoute: () => Promise<Awaited<ReturnType<typeof listPendingRouteStops>>>;
  importProductsFromSpreadsheet: () => Promise<number>;
  exportWorkbook: () => Promise<string>;
  createManualBackup: () => Promise<string>;
  restoreBackup: () => Promise<boolean>;
  shareFile: (fileUri: string, mimeType: string) => Promise<void>;
  setLastError: (message: string | null) => void;
}

const LogisticsContext = createContext<LogisticsContextValue | null>(null);

async function resolveSnapshot(): Promise<LogisticsState> {
  const snapshot = await loadAppSnapshot();
  return {
    ...initialLogisticsState,
    initialized: true,
    ...snapshot,
  };
}

export function LogisticsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LogisticsState>(initialLogisticsState);

  const setLastError = useCallback((message: string | null) => {
    setState((current) => ({ ...current, lastError: message }));
  }, []);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, syncing: true, lastError: null }));
    try {
      const snapshot = await resolveSnapshot();
      setState({ ...snapshot, syncing: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar os dados locais.";
      setState((current) => ({ ...current, syncing: false, lastError: message }));
      throw error;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setState((current) => ({ ...current, syncing: true }));
      try {
        await initializeLogisticsDatabase();
        const snapshot = await resolveSnapshot();
        if (!mounted) return;
        setState({ ...snapshot, syncing: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao iniciar o banco local.";
        if (!mounted) return;
        setState((current) => ({ ...current, syncing: false, lastError: message }));
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const wrapMutation = useCallback(
    async (action: () => Promise<void>) => {
      setState((current) => ({ ...current, syncing: true, lastError: null }));
      try {
        await action();
        const snapshot = await resolveSnapshot();
        setState({ ...snapshot, syncing: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao atualizar os dados.";
        setState((current) => ({ ...current, syncing: false, lastError: message }));
        throw error;
      }
    },
    [],
  );

  const value = useMemo<LogisticsContextValue>(
    () => ({
      state,
      refresh,
      saveProduct: async (draft) => {
        await wrapMutation(async () => {
          await upsertProduct(draft);
        });
      },
      removeProduct: async (productId) => {
        await wrapMutation(async () => {
          await deleteProduct(productId);
        });
      },
      addDelivery: async (draft) => {
        await wrapMutation(async () => {
          await createDelivery(draft);
        });
      },
      changeDeliveryStatus: async (deliveryId, status, latitude, longitude, notes = "") => {
        await wrapMutation(async () => {
          await updateDeliveryStatus(deliveryId, status, latitude ?? null, longitude ?? null, notes);
        });
      },
      finalizeDelivery: async (draft) => {
        await wrapMutation(async () => {
          await completeDelivery(draft);
        });
      },
      moveStock: async (draft) => {
        await wrapMutation(async () => {
          await registerStockMovement(draft);
        });
      },
      connectProductToDelivery: async (deliveryId, productId, quantity) => {
        await wrapMutation(async () => {
          await assignProductToDelivery(deliveryId, productId, quantity);
        });
      },
      runSearch: async (term) => searchAll(term),
      optimizeRoute: async () => listPendingRouteStops(),
      importProductsFromSpreadsheet: async () => {
        const rows = await pickSpreadsheetProducts();

        if (rows.length === 0) {
          return 0;
        }

        await wrapMutation(async () => {
          for (const row of rows) {
            await upsertProduct(row);
          }
        });

        return rows.length;
      },
      exportWorkbook: async () => exportOperationalWorkbook(state.products, state.deliveries),
      createManualBackup: async () => createBackupSnapshot(state),
      restoreBackup: async () => {
        const snapshot = await restoreBackupSnapshot();

        if (!snapshot) {
          return false;
        }

        setState({ ...initialLogisticsState, ...snapshot, initialized: true, syncing: false, lastError: null });
        return true;
      },
      shareFile: async (fileUri, mimeType) => shareLocalFile(fileUri, mimeType),
      setLastError,
    }),
    [refresh, setLastError, state, wrapMutation],
  );

  return <LogisticsContext.Provider value={value}>{children}</LogisticsContext.Provider>;
}

export function useLogistics() {
  const context = useContext(LogisticsContext);

  if (!context) {
    throw new Error("useLogistics deve ser usado dentro de LogisticsProvider.");
  }

  return context;
}
