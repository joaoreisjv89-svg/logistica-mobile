import { ScrollView, Text, View, Pressable, StyleSheet, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLogistics } from "@/lib/logistics/provider";
import * as Haptics from "expo-haptics";

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
});

export default function RelatoriosScreen() {
  const colors = useColors();
  const { state, exportWorkbook, createManualBackup } = useLogistics();
  const [exporting, setExporting] = useState(false);
  const [backing, setBacking] = useState(false);

  const handleExportWorkbook = async () => {
    setExporting(true);
    try {
      const fileUri = await exportWorkbook();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", `Relatório exportado: ${fileUri}`);
    } catch (error) {
      Alert.alert("Erro", "Falha ao exportar relatório");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    setBacking(true);
    try {
      const fileUri = await createManualBackup();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", `Backup criado: ${fileUri}`);
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar backup");
    } finally {
      setBacking(false);
    }
  };

  const totalProducts = state.products.length;
  const totalStock = state.products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = state.products.filter((p) => p.quantity < 5).length;
  const pendingDeliveries = state.deliveries.filter((d) => d.status === "pending").length;
  const deliveredCount = state.deliveries.filter((d) => d.status === "delivered").length;
  const totalMovements = state.movements.length;
  const inMovements = state.movements.filter((m) => m.type === "in").length;
  const outMovements = state.movements.filter((m) => m.type === "out").length;

  return (
    <ScreenContainer className="px-4 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Relatórios</Text>
          <Text className="mt-2 text-sm text-muted">Visualize e exporte dados</Text>
        </View>

        {/* Inventory Metrics */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text className="text-lg font-semibold text-foreground mb-4">📦 Inventário</Text>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Total de Produtos</Text>
            <Text className="text-lg font-bold text-foreground">{totalProducts}</Text>
          </View>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Quantidade Total em Estoque</Text>
            <Text className="text-lg font-bold text-foreground">{totalStock}</Text>
          </View>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Produtos com Baixo Estoque</Text>
            <Text className="text-lg font-bold text-error">{lowStockCount}</Text>
          </View>
        </View>

        {/* Delivery Metrics */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text className="text-lg font-semibold text-foreground mb-4">🚚 Entregas</Text>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Entregas Pendentes</Text>
            <Text className="text-lg font-bold text-warning">{pendingDeliveries}</Text>
          </View>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Entregas Concluídas</Text>
            <Text className="text-lg font-bold text-success">{deliveredCount}</Text>
          </View>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Total de Entregas</Text>
            <Text className="text-lg font-bold text-foreground">{state.deliveries.length}</Text>
          </View>
        </View>

        {/* Movement Metrics */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text className="text-lg font-semibold text-foreground mb-4">📊 Movimentações</Text>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Total de Movimentações</Text>
            <Text className="text-lg font-bold text-foreground">{totalMovements}</Text>
          </View>

          <View style={[styles.metricRow, { borderBottomColor: colors.border }]}>
            <Text className="text-sm text-muted">Entradas</Text>
            <Text className="text-lg font-bold text-success">{inMovements}</Text>
          </View>

          <View style={[styles.metricRow]}>
            <Text className="text-sm text-muted">Saídas</Text>
            <Text className="text-lg font-bold text-error">{outMovements}</Text>
          </View>
        </View>

        {/* Export and Backup Actions */}
        <View className="mt-6 mb-20">
          <Text className="text-lg font-semibold text-foreground mb-4">⚙️ Ações</Text>

          <Pressable
            onPress={handleExportWorkbook}
            disabled={exporting}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: exporting ? 0.6 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.background, fontWeight: "600", fontSize: 16 }}>
              {exporting ? "Exportando..." : "📥 Exportar Relatório (XLSX)"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCreateBackup}
            disabled={backing}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                opacity: backing ? 0.6 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.background, fontWeight: "600", fontSize: 16 }}>
              {backing ? "Criando backup..." : "💾 Criar Backup"}
            </Text>
          </Pressable>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderStyle: "dashed",
              },
            ]}
          >
            <Text className="text-sm font-semibold text-foreground mb-2">💡 Dicas</Text>
            <Text className="text-xs text-muted leading-relaxed">
              • Use "Exportar Relatório" para gerar um arquivo XLSX com todos os dados{"\n"}
              • Use "Criar Backup" para salvar uma cópia de segurança do banco de dados{"\n"}
              • Os arquivos são salvos no armazenamento local do dispositivo{"\n"}
              • Faça backups regularmente para não perder dados importantes
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
