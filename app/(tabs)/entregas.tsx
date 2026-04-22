import { ScrollView, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useLogistics } from "@/lib/logistics/provider";
import { useColors } from "@/hooks/use-colors";

export default function EntregasScreen() {
  const colors = useColors();
  const { state, addDelivery, changeDeliveryStatus, moveStock } = useLogistics();
  const [searchText, setSearchText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
  const [formData, setFormData] = useState({ customerName: "", address: "", customerPhone: "" });

  const filteredDeliveries = state.deliveries.filter((d) => {
    const matchesSearch =
      d.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      d.address.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && d.status === "pending") ||
      (filterStatus === "completed" && d.status === "delivered");
    return matchesSearch && matchesStatus;
  });

  const handleAddDelivery = async () => {
    if (!formData.customerName || !formData.address) {
      Alert.alert("Erro", "Destinatário e endereço são obrigatórios");
      return;
    }
    try {
      await addDelivery({
        customerName: formData.customerName,
        address: formData.address,
        customerPhone: formData.customerPhone,
        notes: "",
      });
      setFormData({ customerName: "", address: "", customerPhone: "" });
      setShowAddModal(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar entrega");
    }
  };

  const handleCompleteDelivery = async (deliveryId: string) => {
    try {
      await changeDeliveryStatus(deliveryId, "delivered");
    } catch (error) {
      Alert.alert("Erro", "Falha ao completar entrega");
    }
  };

  const pendingCount = state.deliveries.filter((d) => d.status === "pending").length;
  const completedCount = state.deliveries.filter((d) => d.status === "delivered").length;

  return (
    <ScreenContainer className="bg-background flex-1">
      {/* Header */}
      <View className="px-4 py-3 bg-primary">
        <Text className="text-white text-2xl font-bold">Entregas</Text>
        <Text className="text-blue-100 text-sm">Gestão de rotas e entregas</Text>
      </View>

      {/* Estatísticas */}
      <View className="flex-row gap-2 px-4 py-3 bg-surface">
        <View className="flex-1 bg-background rounded-lg p-3 border border-border">
          <Text className="text-muted text-xs">Pendentes</Text>
          <Text className="text-warning text-2xl font-bold">{pendingCount}</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-3 border border-border">
          <Text className="text-muted text-xs">Concluídas</Text>
          <Text className="text-success text-2xl font-bold">{completedCount}</Text>
        </View>
      </View>

      {/* Filtros */}
      <View className="flex-row gap-2 px-4 py-3">
        <TouchableOpacity
          onPress={() => setFilterStatus("all")}
          className={`flex-1 py-2 rounded-lg ${filterStatus === "all" ? "bg-primary" : "bg-surface border border-border"}`}
        >
          <Text className={`text-center font-semibold ${filterStatus === "all" ? "text-white" : "text-foreground"}`}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterStatus("pending")}
          className={`flex-1 py-2 rounded-lg ${filterStatus === "pending" ? "bg-warning" : "bg-surface border border-border"}`}
        >
          <Text className={`text-center font-semibold ${filterStatus === "pending" ? "text-white" : "text-foreground"}`}>
            Pendentes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterStatus("completed")}
          className={`flex-1 py-2 rounded-lg ${filterStatus === "completed" ? "bg-success" : "bg-surface border border-border"}`}
        >
          <Text className={`text-center font-semibold ${filterStatus === "completed" ? "text-white" : "text-foreground"}`}>
            Concluídas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Busca */}
      <View className="px-4 py-3">
        <TextInput
          placeholder="Buscar entrega..."
          value={searchText}
          onChangeText={setSearchText}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
          placeholderTextColor={colors.muted}
        />
      </View>

      {/* Lista de Entregas */}
      <FlatList
        data={filteredDeliveries}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        className="px-4 pb-4"
        renderItem={({ item }) => (
          <View className="bg-surface border border-border rounded-lg p-3 mb-2">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item.customerName}</Text>
                <Text className="text-muted text-xs">{item.address}</Text>
              </View>
              <View
                className={`px-2 py-1 rounded ${
                  item.status === "delivered" ? "bg-success" : "bg-warning"
                }`}
              >
                <Text className="text-white text-xs font-semibold">
                  {item.status === "delivered" ? "✓ Entregue" : "⏳ Pendente"}
                </Text>
              </View>
            </View>
            {item.customerPhone && <Text className="text-muted text-xs mb-2">Tel: {item.customerPhone}</Text>}
            {item.status === "pending" && (
              <TouchableOpacity
                onPress={() => handleCompleteDelivery(item.id)}
                className="bg-success py-2 rounded"
              >
                <Text className="text-white text-center font-semibold text-sm">Marcar como Entregue</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Botão Adicionar */}
      <TouchableOpacity
        onPress={() => {
          setFormData({ customerName: "", address: "", customerPhone: "" });
          setShowAddModal(true);
        }}
        className="mx-4 mb-4 bg-primary py-3 rounded-lg"
      >
        <Text className="text-white text-center font-bold">+ Nova Entrega</Text>
      </TouchableOpacity>

      {/* Modal Adicionar */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-4">
            <Text className="text-foreground text-lg font-bold mb-4">Nova Entrega</Text>
            <TextInput
              placeholder="Destinatário"
              value={formData.customerName}
              onChangeText={(text) => setFormData({ ...formData, customerName: text })}
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Endereço"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Telefone (opcional)"
              value={formData.customerPhone}
              onChangeText={(text) => setFormData({ ...formData, customerPhone: text })}
              keyboardType="phone-pad"
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-4 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="flex-1 bg-border py-3 rounded-lg"
              >
                <Text className="text-foreground text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddDelivery}
                className="flex-1 bg-primary py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
