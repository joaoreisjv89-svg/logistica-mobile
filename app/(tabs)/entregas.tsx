import { ScrollView, Text, View, Pressable, StyleSheet, Modal, TextInput, Alert } from "react-native";
import { useState, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLogistics } from "@/lib/logistics/provider";
import { DELIVERY_STATUS_LABEL, type DeliveryStatus } from "@/lib/logistics/types";
import * as Haptics from "expo-haptics";

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  input: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  deliveryCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
});

export default function EntregasScreen() {
  const colors = useColors();
  const { state, addDelivery, changeDeliveryStatus } = useLogistics();
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "delivered">("all");
  const [formData, setFormData] = useState({ customerName: "", customerPhone: "", address: "", notes: "" });

  const filteredDeliveries = useMemo(() => {
    if (filterStatus === "all") return state.deliveries;
    if (filterStatus === "pending") return state.deliveries.filter((d) => d.status === "pending");
    return state.deliveries.filter((d) => d.status === "delivered");
  }, [state.deliveries, filterStatus]);

  const handleOpenModal = () => {
    setFormData({ customerName: "", customerPhone: "", address: "", notes: "" });
    setShowModal(true);
  };

  const handleCreateDelivery = async () => {
    if (!formData.customerName.trim() || !formData.address.trim()) {
      Alert.alert("Erro", "Preencha nome do cliente e endereço");
      return;
    }

    try {
      await addDelivery({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        address: formData.address,
        notes: formData.notes,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Entrega criada!");
      setShowModal(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar entrega");
    }
  };

  const handleChangeStatus = async (deliveryId: string, newStatus: DeliveryStatus) => {
    try {
      await changeDeliveryStatus(deliveryId, newStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", "Status atualizado!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar status");
    }
  };

  const getStatusColor = (status: DeliveryStatus) => {
    if (status === "pending") return colors.warning;
    if (status === "in_route") return colors.primary;
    if (status === "delivered") return colors.success;
    return colors.error;
  };

  return (
    <ScreenContainer className="px-4 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Entregas</Text>
          <Text className="mt-2 text-sm text-muted">Gerencie suas entregas</Text>
        </View>

        <View className="flex-row gap-2 mt-6 mb-4">
          <Pressable
            onPress={() => setFilterStatus("all")}
            style={[
              styles.button,
              {
                flex: 1,
                backgroundColor: filterStatus === "all" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: filterStatus === "all" ? colors.background : colors.foreground, fontWeight: "600" }}>
              Todas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterStatus("pending")}
            style={[
              styles.button,
              {
                flex: 1,
                backgroundColor: filterStatus === "pending" ? colors.warning : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: filterStatus === "pending" ? colors.background : colors.foreground, fontWeight: "600" }}>
              Pendentes
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterStatus("delivered")}
            style={[
              styles.button,
              {
                flex: 1,
                backgroundColor: filterStatus === "delivered" ? colors.success : colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: filterStatus === "delivered" ? colors.background : colors.foreground, fontWeight: "600" }}>
              Entregues
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleOpenModal}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.background, fontWeight: "600", fontSize: 16 }}>
            ➕ Nova Entrega
          </Text>
        </Pressable>

        <View className="mb-20">
          {filteredDeliveries.length === 0 ? (
            <Text className="text-center text-muted py-8">Nenhuma entrega encontrada</Text>
          ) : (
            filteredDeliveries.map((delivery) => (
              <View
                key={delivery.id}
                style={[
                  styles.deliveryCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">{delivery.customerName}</Text>
                    <Text className="text-sm text-muted mt-1">{delivery.address}</Text>
                    {delivery.customerPhone && (
                      <Text className="text-xs text-muted mt-1">📞 {delivery.customerPhone}</Text>
                    )}
                    {delivery.notes && <Text className="text-xs text-muted mt-2">📝 {delivery.notes}</Text>}
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(delivery.status) + "20" },
                  ]}
                >
                  <Text style={{ color: getStatusColor(delivery.status), fontWeight: "600", fontSize: 12 }}>
                    {DELIVERY_STATUS_LABEL[delivery.status]}
                  </Text>
                </View>

                <View className="flex-row gap-2 mt-3">
                  {delivery.status === "pending" && (
                    <Pressable
                      onPress={() => handleChangeStatus(delivery.id, "in_route")}
                      style={[
                        styles.button,
                        {
                          flex: 1,
                          backgroundColor: colors.primary,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.background, fontWeight: "600", fontSize: 14 }}>
                        🚗 Em Rota
                      </Text>
                    </Pressable>
                  )}
                  {delivery.status === "in_route" && (
                    <Pressable
                      onPress={() => handleChangeStatus(delivery.id, "delivered")}
                      style={[
                        styles.button,
                        {
                          flex: 1,
                          backgroundColor: colors.success,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.background, fontWeight: "600", fontSize: 14 }}>
                        ✓ Entregue
                      </Text>
                    </Pressable>
                  )}
                  {delivery.status === "delivered" && (
                    <Pressable
                      onPress={() => handleChangeStatus(delivery.id, "pending")}
                      style={[
                        styles.button,
                        {
                          flex: 1,
                          backgroundColor: colors.warning,
                          marginBottom: 0,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.background, fontWeight: "600", fontSize: 14 }}>
                        ↻ Reabrir
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 40,
            }}
          >
            <Text className="text-xl font-bold text-foreground mb-4">Nova Entrega</Text>

            <TextInput
              value={formData.customerName}
              onChangeText={(text) => setFormData({ ...formData, customerName: text })}
              placeholder="Nome do Cliente"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
              ]}
            />

            <TextInput
              value={formData.customerPhone}
              onChangeText={(text) => setFormData({ ...formData, customerPhone: text })}
              placeholder="Telefone (opcional)"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
              ]}
            />

            <TextInput
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Endereço"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
              ]}
            />

            <TextInput
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Notas (opcional)"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1, textAlignVertical: "top" },
              ]}
            />

            <Pressable
              onPress={handleCreateDelivery}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.background, fontWeight: "600" }}>Criar Entrega</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowModal(false)}
              style={[styles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
