import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { validateDeliveryDraft } from "@/lib/logistics/helpers";
import { useLogistics } from "@/lib/logistics/provider";
import { DELIVERY_STATUS_LABEL, type DeliveryRecord } from "@/lib/logistics/types";

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

const STATUS_FILTERS: Array<DeliveryRecord["status"] | "all"> = ["all", "pending", "in_route", "delivered", "cancelled"];

export default function DeliveriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state, addDelivery, changeDeliveryStatus, setLastError } = useLogistics();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>("all");

  const deliveries = useMemo(() => {
    if (statusFilter === "all") {
      return state.deliveries;
    }

    return state.deliveries.filter((delivery) => delivery.status === statusFilter);
  }, [state.deliveries, statusFilter]);

  async function handleCreateDelivery() {
    const draft = { customerName, customerPhone, address, notes };
    const validation = validateDeliveryDraft(draft);

    if (!validation.valid) {
      setLastError(validation.errors[0] ?? "Preencha a entrega corretamente.");
      return;
    }

    try {
      await addDelivery(draft);
      setCustomerName("");
      setCustomerPhone("");
      setAddress("");
      setNotes("");
    } catch {
      // provider already stores error
    }
  }

  return (
    <ScreenContainer className="px-5 pb-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Entregas</Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            Cadastre entregas, acompanhe os status operacionais e mantenha a fila pronta para roteirização.
          </Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-6 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Nova entrega</Text>
          <TextInput
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Nome do cliente"
            placeholderTextColor={colors.muted}
            style={[styles.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          <TextInput
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="Telefone"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            style={[styles.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Endereço de entrega"
            placeholderTextColor={colors.muted}
            style={[styles.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Observações"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12, minHeight: 88, textAlignVertical: "top" }]}
          />
          <Pressable
            onPress={handleCreateDelivery}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                marginTop: 14,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text className="text-base font-semibold text-background">Salvar entrega</Text>
          </Pressable>
          {state.lastError ? <Text className="mt-3 text-sm leading-6 text-error">{state.lastError}</Text> : null}
        </View>

        <View className="mt-6">
          <Text className="text-xl font-semibold text-foreground">Status</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => {
              const selected = statusFilter === status;
              const label = status === "all" ? "Todas" : DELIVERY_STATUS_LABEL[status];
              return (
                <Pressable
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}
                >
                  <Text className={selected ? "text-sm font-semibold text-background" : "text-sm font-semibold text-foreground"}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-4 gap-3">
          {deliveries.length === 0 ? (
            <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl border px-4 py-5">
              <Text className="text-sm leading-6 text-muted">
                Nenhuma entrega registrada com o filtro atual. Cadastre uma nova entrega para iniciar a operação.
              </Text>
            </View>
          ) : (
            deliveries.map((delivery) => (
              <View key={delivery.id} style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl border px-4 py-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-base font-semibold text-foreground">{delivery.customerName}</Text>
                  <Text className="text-sm font-semibold text-primary">{DELIVERY_STATUS_LABEL[delivery.status]}</Text>
                </View>
                <Text className="mt-1 text-sm leading-6 text-muted">{delivery.address}</Text>
                <Text className="mt-1 text-sm text-muted">Telefone {delivery.customerPhone}</Text>
                <Text className="mt-1 text-sm text-muted">{delivery.assignedProductCount} item(ns) vinculados</Text>
                <View className="mt-4 flex-row gap-2">
                  <Pressable
                    onPress={() => router.push({ pathname: "/delivery-detail/[id]", params: { id: delivery.id } })}
                    style={({ pressed }) => [styles.button, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, flex: 1, opacity: pressed ? 0.88 : 1 }]}
                  >
                    <Text className="text-sm font-semibold text-foreground">Detalhe</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => changeDeliveryStatus(delivery.id, "in_route", delivery.latitude, delivery.longitude, "Entrega em rota")}
                    style={({ pressed }) => [styles.button, { backgroundColor: colors.warning, flex: 1, opacity: pressed ? 0.88 : 1 }]}
                  >
                    <Text className="text-sm font-semibold text-background">Em rota</Text>
                  </Pressable>
                </View>
                <View className="mt-2 flex-row gap-2">
                  <Pressable
                    onPress={() => router.push("/map")}
                    style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, flex: 1, opacity: pressed ? 0.88 : 1 }]}
                  >
                    <Text className="text-sm font-semibold text-background">Ver rota</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => changeDeliveryStatus(delivery.id, "delivered", delivery.latitude, delivery.longitude, "Entrega concluída")}
                    style={({ pressed }) => [styles.button, { backgroundColor: colors.success, flex: 1, opacity: pressed ? 0.88 : 1 }]}
                  >
                    <Text className="text-sm font-semibold text-background">Concluir</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
