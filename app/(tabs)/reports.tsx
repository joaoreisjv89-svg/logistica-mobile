import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardCard } from "@/components/logistics/dashboard-card";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLogistics } from "@/lib/logistics/provider";

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function ReportsScreen() {
  const colors = useColors();
  const {
    state,
    createManualBackup,
    exportWorkbook,
    importProductsFromSpreadsheet,
    restoreBackup,
    setLastError,
    shareFile,
  } = useLogistics();
  const [lastGeneratedFile, setLastGeneratedFile] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleImportProducts() {
    try {
      const count = await importProductsFromSpreadsheet();
      setStatusMessage(count === 0 ? "Nenhum item foi importado da planilha selecionada." : `${count} produto(s) importados com sucesso.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao importar a planilha.";
      setLastError(message);
    }
  }

  async function handleExportWorkbook() {
    try {
      const fileUri = await exportWorkbook();
      setLastGeneratedFile(fileUri);
      setStatusMessage("Relatório XLSX gerado no armazenamento local do dispositivo.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao exportar o relatório XLSX.";
      setLastError(message);
    }
  }

  async function handleCreateBackup() {
    try {
      const fileUri = await createManualBackup();
      setLastGeneratedFile(fileUri);
      setStatusMessage("Backup manual gerado com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao gerar o backup local.";
      setLastError(message);
    }
  }

  async function handleRestoreBackup() {
    try {
      const restored = await restoreBackup();
      setStatusMessage(restored ? "Backup restaurado para a memória local do aplicativo." : "Restauração cancelada pelo usuário.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao restaurar o backup.";
      setLastError(message);
    }
  }

  async function handleShareLastFile() {
    if (!lastGeneratedFile) {
      setStatusMessage("Gere um relatório ou backup antes de compartilhar o arquivo.");
      return;
    }

    try {
      const mimeType = lastGeneratedFile.endsWith(".xlsx")
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/json";
      await shareFile(lastGeneratedFile, mimeType);
      setStatusMessage("Compartilhamento iniciado no dispositivo.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao compartilhar o arquivo.";
      setLastError(message);
    }
  }

  return (
    <ScreenContainer className="px-5 pb-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Relatórios</Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            Visualize indicadores locais, importe produtos por planilha, exporte o consolidado operacional e mantenha backups manuais.
          </Text>
        </View>

        <View className="mt-6 flex-row gap-3">
          <DashboardCard label="Total de entregas" value={String(state.deliveries.length)} tone="primary" />
          <DashboardCard label="Produtos cadastrados" value={String(state.products.length)} tone="success" />
        </View>

        <View className="mt-3 flex-row gap-3">
          <DashboardCard label="Movimentações" value={String(state.movements.length)} tone="warning" />
          <DashboardCard label="Backups locais" value={String(state.backups.length)} tone="neutral" />
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-6 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Entregas por dia</Text>
          <View className="mt-4 gap-3">
            {state.dashboard.deliveryChart.length === 0 ? (
              <Text className="text-sm leading-6 text-muted">Ainda não há registros suficientes para montar o gráfico diário.</Text>
            ) : (
              state.dashboard.deliveryChart.map((point) => (
                <View key={point.label} className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-sm text-muted">{point.label}</Text>
                  <View className="flex-1 rounded-full bg-border/40">
                    <View
                      style={{
                        width: `${Math.max(12, point.value * 18)}%`,
                        backgroundColor: colors.primary,
                        borderRadius: 999,
                        height: 10,
                      }}
                    />
                  </View>
                  <Text className="w-8 text-right text-sm font-semibold text-foreground">{point.value}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-4 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Movimentação de inventário</Text>
          <View className="mt-4 gap-3">
            {state.dashboard.inventoryChart.length === 0 ? (
              <Text className="text-sm leading-6 text-muted">As quantidades movimentadas aparecerão aqui após as primeiras operações de estoque.</Text>
            ) : (
              state.dashboard.inventoryChart.map((point) => (
                <View key={point.label} className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-sm text-muted">{point.label}</Text>
                  <View className="flex-1 rounded-full bg-border/40">
                    <View
                      style={{
                        width: `${Math.max(12, point.value * 12)}%`,
                        backgroundColor: colors.success,
                        borderRadius: 999,
                        height: 10,
                      }}
                    />
                  </View>
                  <Text className="w-8 text-right text-sm font-semibold text-foreground">{point.value}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-4 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Operações de arquivo</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Utilize estas ações para importar inventário por Excel, gerar um relatório XLSX consolidado ou produzir backups JSON do aplicativo.
          </Text>
          <View className="mt-4 gap-3">
            <Pressable
              onPress={handleImportProducts}
              style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text className="text-base font-semibold text-background">Importar produtos por planilha</Text>
            </Pressable>
            <Pressable
              onPress={handleExportWorkbook}
              style={({ pressed }) => [styles.button, { backgroundColor: colors.success, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text className="text-base font-semibold text-background">Exportar relatório XLSX</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateBackup}
              style={({ pressed }) => [styles.button, { backgroundColor: colors.warning, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text className="text-base font-semibold text-background">Criar backup manual</Text>
            </Pressable>
            <Pressable
              onPress={handleRestoreBackup}
              style={({ pressed }) => [styles.button, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text className="text-base font-semibold text-foreground">Restaurar backup</Text>
            </Pressable>
            <Pressable
              onPress={handleShareLastFile}
              style={({ pressed }) => [styles.button, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text className="text-base font-semibold text-foreground">Compartilhar último arquivo</Text>
            </Pressable>
          </View>

          {statusMessage ? <Text className="mt-4 text-sm leading-6 text-success">{statusMessage}</Text> : null}
          {lastGeneratedFile ? <Text className="mt-2 text-xs leading-5 text-muted">Último arquivo: {lastGeneratedFile}</Text> : null}
          {state.lastError ? <Text className="mt-2 text-sm leading-6 text-error">{state.lastError}</Text> : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
