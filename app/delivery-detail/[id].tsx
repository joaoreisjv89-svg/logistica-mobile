import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { formatCompactDateTime } from "@/lib/logistics/helpers";
import { getCurrentCoordinate } from "@/lib/logistics/location";
import { useLogistics } from "@/lib/logistics/provider";
import { DELIVERY_STATUS_LABEL } from "@/lib/logistics/types";

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    width: "100%",
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
  },
});

export default function DeliveryDetailScreen() {
  const colors = useColors();
  const cameraRef = useRef<CameraView>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, finalizeDelivery, changeDeliveryStatus, setLastError } = useLogistics();
  const [permission, requestPermission] = useCameraPermissions();
  const [captureMode, setCaptureMode] = useState(false);
  const [proofPhotoUri, setProofPhotoUri] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const delivery = useMemo(() => state.deliveries.find((item) => item.id === id) ?? null, [id, state.deliveries]);
  const relatedEvents = useMemo(() => state.deliveryEvents.filter((event) => event.deliveryId === id), [id, state.deliveryEvents]);

  async function handleResolveLocation() {
    try {
      const coordinate = await getCurrentCoordinate();
      setResolvedLocation(coordinate);
      if (delivery) {
        await changeDeliveryStatus(delivery.id, delivery.status, coordinate.latitude, coordinate.longitude, "Localização registrada");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível obter a localização atual.";
      setLastError(message);
    }
  }

  async function handleTakePhoto() {
    const camera = cameraRef.current;
    if (!camera) {
      return;
    }

    try {
      const photo = await camera.takePictureAsync({ quality: 0.8, base64: false, skipProcessing: false });
      setProofPhotoUri(photo.uri);
      setCaptureMode(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível capturar a foto da entrega.";
      setLastError(message);
    }
  }

  async function handleFinalize() {
    if (!delivery) {
      return;
    }

    try {
      const coordinate = resolvedLocation ?? (await getCurrentCoordinate());
      await finalizeDelivery({
        deliveryId: delivery.id,
        proofPhotoUri,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        notes: "Entrega finalizada com comprovante local",
      });
      setResolvedLocation(coordinate);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir a entrega.";
      setLastError(message);
    }
  }

  if (!delivery) {
    return (
      <ScreenContainer className="items-center justify-center px-5">
        <Text className="text-base text-muted">Entrega não encontrada.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5 pb-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 72 }}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Detalhe da entrega</Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            Revise os dados do cliente, registre localização, capture a prova e conclua a operação localmente.
          </Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-6 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">{delivery.customerName}</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">{delivery.address}</Text>
          <Text className="mt-1 text-sm text-muted">Telefone {delivery.customerPhone}</Text>
          <Text className="mt-1 text-sm text-muted">Status {DELIVERY_STATUS_LABEL[delivery.status]}</Text>
          <Text className="mt-1 text-sm text-muted">Itens vinculados {delivery.assignedProductCount}</Text>
          {delivery.notes ? <Text className="mt-2 text-sm leading-6 text-muted">{delivery.notes}</Text> : null}
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-4 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Comprovante e localização</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            {resolvedLocation
              ? `GPS registrado: ${resolvedLocation.latitude.toFixed(5)}, ${resolvedLocation.longitude.toFixed(5)}`
              : "A localização ainda não foi registrada para esta entrega."}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            {proofPhotoUri ? "Foto de comprovante capturada e pronta para anexar." : "Nenhuma foto de comprovante capturada ainda."}
          </Text>

          <View className="mt-4 gap-3">
            <Pressable
              onPress={handleResolveLocation}
              style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text className="text-base font-semibold text-background">Registrar localização</Text>
            </Pressable>
            <Pressable
              onPress={() => setCaptureMode((current) => !current)}
              style={({ pressed }) => [styles.button, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, opacity: pressed ? 0.88 : 1 }]}
            >
              <Text className="text-base font-semibold text-foreground">{captureMode ? "Fechar câmera" : "Capturar comprovante"}</Text>
            </Pressable>
          </View>
        </View>

        {captureMode ? (
          <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-4 rounded-3xl border p-3">
            {!permission?.granted ? (
              <View className="px-3 py-4">
                <Text className="text-sm leading-6 text-muted">Permita o uso da câmera para registrar a prova de entrega.</Text>
                <Pressable
                  onPress={requestPermission}
                  style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, marginTop: 14, opacity: pressed ? 0.88 : 1 }]}
                >
                  <Text className="text-base font-semibold text-background">Permitir câmera</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <CameraView ref={cameraRef} style={styles.camera} facing="back" />
                <Pressable
                  onPress={handleTakePhoto}
                  style={({ pressed }) => [styles.button, { backgroundColor: colors.success, marginTop: 14, opacity: pressed ? 0.88 : 1 }]}
                >
                  <Text className="text-base font-semibold text-background">Tirar foto</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-4 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Histórico operacional</Text>
          <View className="mt-4 gap-3">
            {relatedEvents.length === 0 ? (
              <Text className="text-sm leading-6 text-muted">Ainda não há eventos registrados para esta entrega.</Text>
            ) : (
              relatedEvents.map((event) => (
                <View key={event.id} className="border-l-2 border-primary pl-3">
                  <Text className="text-sm font-semibold text-foreground">{DELIVERY_STATUS_LABEL[event.status]}</Text>
                  <Text className="mt-1 text-sm leading-6 text-muted">{event.notes || "Evento operacional"}</Text>
                  <Text className="mt-1 text-xs text-muted">{formatCompactDateTime(event.eventAt)}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <Pressable
          onPress={handleFinalize}
          style={({ pressed }) => [styles.button, { backgroundColor: colors.success, marginTop: 18, opacity: pressed ? 0.88 : 1 }]}
        >
          <Text className="text-base font-semibold text-background">Concluir entrega</Text>
        </Pressable>

        {state.lastError ? <Text className="mt-4 text-sm leading-6 text-error">{state.lastError}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}
