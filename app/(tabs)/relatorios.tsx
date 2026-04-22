import { ScrollView, Text, View, TouchableOpacity, FlatList, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useLogistics } from "@/lib/logistics/provider";
import { useColors } from "@/hooks/use-colors";

export default function RelatoriosScreen() {
  const colors = useColors();
  const { state, exportWorkbook, createManualBackup, shareFile } = useLogistics();
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const handleExportWorkbook = async () => {
    setExporting(true);
    try {
      const fileUri = await exportWorkbook();
      await shareFile(fileUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      Alert.alert("Sucesso", "Relatório exportado com sucesso");
    } catch (error) {
      Alert.alert("Erro", "Falha ao exportar relatório");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    try {
      const fileUri = await createManualBackup();
      await shareFile(fileUri, "application/json");
      Alert.alert("Sucesso", "Backup criado com sucesso");
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar backup");
    } finally {
      setBackingUp(false);
    }
  };

  const metrics = state.dashboard.metrics;
  const recentMovements = state.movements.slice(0, 5);

  return (
    <ScreenContainer className="bg-background flex-1">
      <ScrollView>
        {/* Header */}
        <View className="px-4 py-3 bg-primary">
          <Text className="text-white text-2xl font-bold">Relatórios</Text>
          <Text className="text-blue-100 text-sm">Métricas e exportação de dados</Text>
        </View>

        {/* KPIs */}
        <View className="px-4 py-4">
          <Text className="text-foreground font-bold text-lg mb-3">Métricas do Dia</Text>
          <View className="grid grid-cols-2 gap-3">
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-muted text-xs">Entregas Hoje</Text>
              <Text className="text-primary text-3xl font-bold">{metrics.deliveriesToday}</Text>
            </View>
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-muted text-xs">Produtos Escaneados</Text>
              <Text className="text-success text-3xl font-bold">{metrics.productsScannedToday}</Text>
            </View>
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-muted text-xs">Pendentes</Text>
              <Text className="text-warning text-3xl font-bold">{metrics.pendingDeliveries}</Text>
            </View>
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-muted text-xs">Concluídas</Text>
              <Text className="text-success text-3xl font-bold">{metrics.completedDeliveries}</Text>
            </View>
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-muted text-xs">Total em Estoque</Text>
              <Text className="text-primary text-3xl font-bold">{metrics.totalProductsInStock}</Text>
            </View>
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-muted text-xs">Baixo Estoque</Text>
              <Text className="text-error text-3xl font-bold">{metrics.lowStockProducts}</Text>
            </View>
          </View>
        </View>

        {/* Ações */}
        <View className="px-4 py-4 gap-3">
          <TouchableOpacity
            onPress={handleExportWorkbook}
            disabled={exporting}
            className={`py-4 rounded-lg ${exporting ? "bg-border" : "bg-primary"}`}
          >
            <Text className="text-white text-center font-bold">
              {exporting ? "Exportando..." : "📊 Exportar Relatório Excel"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreateBackup}
            disabled={backingUp}
            className={`py-4 rounded-lg ${backingUp ? "bg-border" : "bg-warning"}`}
          >
            <Text className="text-white text-center font-bold">
              {backingUp ? "Criando backup..." : "💾 Criar Backup"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Movimentos Recentes */}
        <View className="px-4 pb-4">
          <Text className="text-foreground font-bold text-lg mb-3">Movimentos Recentes</Text>
          <FlatList
            data={recentMovements}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="bg-surface border border-border rounded-lg p-3 mb-2">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{item.productName}</Text>
                    <Text className="text-muted text-xs">Código: {item.productCode}</Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded ${item.type === "in" ? "bg-success" : "bg-error"}`}
                  >
                    <Text className="text-white text-xs font-semibold">
                      {item.type === "in" ? "+ " : "- "}{item.quantity}
                    </Text>
                  </View>
                </View>
                <Text className="text-muted text-xs mt-1">{new Date(item.createdAt).toLocaleString("pt-BR")}</Text>
              </View>
            )}
          />
        </View>

        {/* Informações */}
        <View className="px-4 pb-8">
          <View className="bg-surface border border-border rounded-lg p-4">
            <Text className="text-foreground font-bold mb-2">Informações do Sistema</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted">Total de Produtos:</Text>
                <Text className="text-foreground font-semibold">{state.products.length}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Total de Entregas:</Text>
                <Text className="text-foreground font-semibold">{state.deliveries.length}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Movimentos Registrados:</Text>
                <Text className="text-foreground font-semibold">{state.movements.length}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Backups Criados:</Text>
                <Text className="text-foreground font-semibold">{state.backups.length}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
