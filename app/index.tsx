import { useState, useMemo, useCallback } from "react";
import { ScrollView, Text, View, Pressable, StyleSheet, Modal, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLogistics } from "@/lib/logistics/provider";
import * as Haptics from "expo-haptics";

const styles = StyleSheet.create({
  largeButton: {
    minHeight: 80,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSubtext: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  input: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});

export default function DashboardScreen() {
  const colors = useColors();
  const { state, moveStock, saveProduct, addDelivery } = useLogistics();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Scanner modal state
  const [scanBarcode, setScanBarcode] = useState("");
  const [scanQuantity, setScanQuantity] = useState("1");
  const [scanNotes, setScanNotes] = useState("");
  
  // Delivery modal state
  const [deliveryCustomer, setDeliveryCustomer] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  
  // Inventory search state
  const [searchText, setSearchText] = useState("");

  const handleButtonPress = (modal: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveModal(modal);
  };

  const handleScanSubmit = useCallback(async (type: "entry" | "exit") => {
    if (!scanBarcode.trim()) {
      Alert.alert("Erro", "Por favor, insira um código de barras");
      return;
    }

    const product = state.products.find((p) => p.code === scanBarcode);
    if (!product) {
      Alert.alert("Produto não encontrado", `Código: ${scanBarcode}`);
      return;
    }

    const qty = parseInt(scanQuantity) || 1;
    try {
      await moveStock({
        productId: product.id,
        quantity: qty,
        type: type === "entry" ? "in" : "out",
        notes: scanNotes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", `${type === "entry" ? "Entrada" : "Saída"} registrada com sucesso`);
      setScanBarcode("");
      setScanQuantity("1");
      setScanNotes("");
      setActiveModal(null);
    } catch (error) {
      Alert.alert("Erro", "Falha ao registrar movimento");
    }
  }, [scanBarcode, scanQuantity, scanNotes, state.products, moveStock]);

  const handleCreateDelivery = useCallback(async () => {
    if (!deliveryCustomer.trim() || !deliveryAddress.trim()) {
      Alert.alert("Erro", "Preencha nome do cliente e endereço");
      return;
    }

    try {
      await addDelivery({
        customerName: deliveryCustomer,
        customerPhone: deliveryPhone,
        address: deliveryAddress,
        notes: deliveryNotes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Entrega criada com sucesso");
      setDeliveryCustomer("");
      setDeliveryPhone("");
      setDeliveryAddress("");
      setDeliveryNotes("");
      setActiveModal(null);
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar entrega");
    }
  }, [deliveryCustomer, deliveryPhone, deliveryAddress, deliveryNotes, addDelivery]);

  const filteredProducts = useMemo(() => {
    const search = searchText.toLowerCase();
    return state.products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.code.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
    );
  }, [state.products, searchText]);

  const stats = useMemo(() => [
    { label: "Escaneados hoje", value: state.dashboard.metrics.productsScannedToday },
    { label: "Entregas hoje", value: state.dashboard.metrics.deliveriesToday },
    { label: "Em estoque", value: state.dashboard.metrics.totalProductsInStock },
    { label: "Pendentes", value: state.dashboard.metrics.pendingDeliveries },
    { label: "Entregues", value: state.dashboard.metrics.completedDeliveries },
    { label: "Baixo estoque", value: state.dashboard.metrics.lowStockProducts },
  ], [state.dashboard.metrics]);

  return (
    <ScreenContainer className="px-4 pb-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text className="text-4xl font-bold text-foreground">Rota Estoque</Text>
          <Text className="mt-2 text-sm text-muted">Gestão de inventário e entregas</Text>
        </View>

        {/* Statistics Grid */}
        <View className="mb-6">
          <View className="flex-row flex-wrap">
            {stats.slice(0, 3).map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: colors.surface, flex: 0.33, marginRight: idx < 2 ? 8 : 0 }]}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row flex-wrap mt-2">
            {stats.slice(3, 6).map((stat, idx) => (
              <View key={idx} style={[styles.statCard, { backgroundColor: colors.surface, flex: 0.33, marginRight: idx < 2 ? 8 : 0 }]}>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: colors.success }]}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Main Action Buttons */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Ações principais</Text>

          {/* Row 1 */}
          <Pressable
            onPress={() => handleButtonPress("scanEntry")}
            style={({ pressed }) => [styles.largeButton, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>📥 Entrada de Produto</Text>
            <Text style={[styles.buttonSubtext, { color: colors.background }]}>Escanear entrada de estoque</Text>
          </Pressable>

          <Pressable
            onPress={() => handleButtonPress("scanExit")}
            style={({ pressed }) => [styles.largeButton, { backgroundColor: colors.warning, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>📤 Saída de Produto</Text>
            <Text style={[styles.buttonSubtext, { color: colors.background }]}>Escanear saída de estoque</Text>
          </Pressable>

          {/* Row 2 */}
          <Pressable
            onPress={() => handleButtonPress("createDelivery")}
            style={({ pressed }) => [styles.largeButton, { backgroundColor: colors.success, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>🚚 Criar Entrega</Text>
            <Text style={[styles.buttonSubtext, { color: colors.background }]}>Registrar novo pedido de entrega</Text>
          </Pressable>

          <Pressable
            onPress={() => handleButtonPress("inventory")}
            style={({ pressed }) => [styles.largeButton, { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.primary }]}>📦 Lista de Inventário</Text>
            <Text style={[styles.buttonSubtext, { color: colors.muted }]}>Ver, editar e gerenciar produtos</Text>
          </Pressable>

          {/* Row 3 */}
          <Pressable
            onPress={() => handleButtonPress("map")}
            style={({ pressed }) => [styles.largeButton, { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.success, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.success }]}>🗺️ Mapa de Entregas</Text>
            <Text style={[styles.buttonSubtext, { color: colors.muted }]}>Visualizar rotas e localizações</Text>
          </Pressable>

          <Pressable
            onPress={() => handleButtonPress("export")}
            style={({ pressed }) => [styles.largeButton, { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.warning, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.warning }]}>📊 Exportar Excel</Text>
            <Text style={[styles.buttonSubtext, { color: colors.muted }]}>Gerar relatórios em XLSX</Text>
          </Pressable>

          {/* Row 4 */}
          <Pressable
            onPress={() => handleButtonPress("reports")}
            style={({ pressed }) => [styles.largeButton, { backgroundColor: colors.background, borderWidth: 2, borderColor: colors.muted, opacity: pressed ? 0.88 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.foreground }]}>📈 Relatórios</Text>
            <Text style={[styles.buttonSubtext, { color: colors.muted }]}>Ver estatísticas e indicadores</Text>
          </Pressable>
        </View>

        {/* Recent Activity */}
        {state.dashboard.recentMovements.length > 0 && (
          <View className="mt-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Atividade recente</Text>
            {state.dashboard.recentMovements.slice(0, 3).map((movement) => (
              <View
                key={movement.id}
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                className="rounded-xl border px-3 py-3 mb-2"
              >
                <Text className="text-sm font-medium text-foreground">{movement.productName}</Text>
                <Text className="text-xs text-muted mt-1">{movement.createdAt}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* SCANNER MODAL - ENTRY */}
      <Modal visible={activeModal === "scanEntry"} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 20,
              maxHeight: "85%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>📥 Entrada de Produto</Text>
              <Pressable onPress={() => setActiveModal(null)}>
                <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Código de Barras</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="EAN13, UPC ou QR Code"
                placeholderTextColor={colors.muted}
                value={scanBarcode}
                onChangeText={setScanBarcode}
                autoFocus
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Quantidade</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="1"
                placeholderTextColor={colors.muted}
                value={scanQuantity}
                onChangeText={setScanQuantity}
                keyboardType="number-pad"
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Observações (opcional)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                    minHeight: 80,
                    textAlignVertical: "top",
                  },
                ]}
                placeholder="Adicione notas se necessário"
                placeholderTextColor={colors.muted}
                value={scanNotes}
                onChangeText={setScanNotes}
                multiline
              />

              <Pressable
                onPress={() => handleScanSubmit("entry")}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.background }]}>✓ Confirmar Entrada</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveModal(null)}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SCANNER MODAL - EXIT */}
      <Modal visible={activeModal === "scanExit"} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 20,
              maxHeight: "85%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>📤 Saída de Produto</Text>
              <Pressable onPress={() => setActiveModal(null)}>
                <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Código de Barras</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="EAN13, UPC ou QR Code"
                placeholderTextColor={colors.muted}
                value={scanBarcode}
                onChangeText={setScanBarcode}
                autoFocus
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Quantidade</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="1"
                placeholderTextColor={colors.muted}
                value={scanQuantity}
                onChangeText={setScanQuantity}
                keyboardType="number-pad"
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Observações (opcional)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                    minHeight: 80,
                    textAlignVertical: "top",
                  },
                ]}
                placeholder="Adicione notas se necessário"
                placeholderTextColor={colors.muted}
                value={scanNotes}
                onChangeText={setScanNotes}
                multiline
              />

              <Pressable
                onPress={() => handleScanSubmit("exit")}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.warning,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.background }]}>✓ Confirmar Saída</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveModal(null)}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DELIVERY MODAL */}
      <Modal visible={activeModal === "createDelivery"} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 20,
              maxHeight: "90%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>🚚 Criar Entrega</Text>
              <Pressable onPress={() => setActiveModal(null)}>
                <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Nome do Cliente *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="Nome completo"
                placeholderTextColor={colors.muted}
                value={deliveryCustomer}
                onChangeText={setDeliveryCustomer}
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Telefone (opcional)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
                placeholder="(11) 99999-9999"
                placeholderTextColor={colors.muted}
                value={deliveryPhone}
                onChangeText={setDeliveryPhone}
                keyboardType="phone-pad"
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Endereço *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                    minHeight: 80,
                    textAlignVertical: "top",
                  },
                ]}
                placeholder="Rua, número, bairro, cidade"
                placeholderTextColor={colors.muted}
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
                multiline
              />

              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>Observações (opcional)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderWidth: 1,
                    minHeight: 80,
                    textAlignVertical: "top",
                  },
                ]}
                placeholder="Instruções especiais, referências, etc."
                placeholderTextColor={colors.muted}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
                multiline
              />

              <Pressable
                onPress={handleCreateDelivery}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.success,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.background }]}>✓ Criar Entrega</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveModal(null)}
                style={({ pressed }) => [
                  styles.modalButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.foreground }]}>Cancelar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* INVENTORY MODAL */}
      <Modal visible={activeModal === "inventory"} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 20,
              maxHeight: "90%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>📦 Lista de Inventário</Text>
              <Pressable onPress={() => setActiveModal(null)}>
                <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
              placeholder="Buscar por nome, código ou categoria..."
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={setSearchText}
            />

            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
              {filteredProducts.length} produto(s) encontrado(s)
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredProducts.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, color: colors.muted }}>Nenhum produto encontrado</Text>
                </View>
              ) : (
                filteredProducts.map((product) => (
                  <View
                    key={product.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{product.name}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                        {product.code} • {product.category}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: product.quantity > 0 ? colors.success : colors.error }}>
                        {product.quantity}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>unidades</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <Pressable
              onPress={() => setActiveModal(null)}
              style={({ pressed }) => [
                styles.modalButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.88 : 1,
                  marginTop: 12,
                },
              ]}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.background }}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
