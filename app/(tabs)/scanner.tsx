import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLogistics } from "@/lib/logistics/provider";

const styles = StyleSheet.create({
  camera: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    minHeight: 360,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  frame: {
    borderWidth: 2,
    borderRadius: 24,
    height: 220,
    marginHorizontal: 12,
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});

async function triggerSuccessFeedback() {
  if (Platform.OS !== "web") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export default function ScannerScreen() {
  const colors = useColors();
  const { state, moveStock } = useLogistics();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [quantity, setQuantity] = useState("1");

  const detectedProduct = useMemo(
    () => state.products.find((product) => product.code.toLowerCase() === barcodeValue.trim().toLowerCase()) ?? null,
    [barcodeValue, state.products],
  );

  async function onBarcodeScanned(result: BarcodeScanningResult) {
    if (locked) return;
    setLocked(true);
    setBarcodeValue(result.data.trim());
    await triggerSuccessFeedback();
  }

  async function handleMovement(type: "in" | "out") {
    if (!detectedProduct) {
      return;
    }

    try {
      await moveStock({
        productId: detectedProduct.id,
        quantity: Number(quantity || 1),
        type,
        notes: type === "in" ? "Entrada por scanner" : "Saída por scanner",
      });
      setLocked(false);
      setBarcodeValue("");
      setQuantity("1");
    } catch {
      // handled by provider
    }
  }

  if (!permission) {
    return (
      <ScreenContainer className="items-center justify-center px-5">
        <Text className="text-base text-muted">Carregando permissões de câmera...</Text>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="px-5 py-8">
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl border px-5 py-6">
          <Text className="text-2xl font-bold text-foreground">Scanner</Text>
          <Text className="mt-3 text-base leading-7 text-muted">
            Para ler códigos EAN13, UPC e QR, permita o acesso à câmera do dispositivo.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                marginTop: 18,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text className="text-base font-semibold text-background">Permitir câmera</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-5 pb-6">
      <View className="pt-4">
        <Text className="text-3xl font-bold text-foreground">Scanner</Text>
        <Text className="mt-2 text-base leading-6 text-muted">
          Leia o código, identifique o produto automaticamente e registre entrada ou saída do estoque.
        </Text>
      </View>

      <View className="mt-5 flex-1">
        <View style={{ borderColor: colors.border, backgroundColor: colors.surface }} className="rounded-[28px] border p-2">
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={locked ? undefined : onBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "upc_a", "upc_e"] }}
          >
            <View style={styles.overlay}>
              <Text className="text-center text-base font-semibold text-white">Posicione o código dentro da moldura</Text>
              <View style={[styles.frame, { borderColor: colors.primary }]} />
              <Text className="text-center text-sm text-white">A leitura será pausada após a primeira detecção para evitar duplicidade.</Text>
            </View>
          </CameraView>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-4 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Resultado da leitura</Text>
          <TextInput
            value={barcodeValue}
            onChangeText={setBarcodeValue}
            placeholder="Código detectado"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Quantidade"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          {detectedProduct ? (
            <>
              <Text className="mt-3 text-sm leading-6 text-muted">
                Produto reconhecido: {detectedProduct.name} · estoque atual {detectedProduct.quantity}.
              </Text>
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => handleMovement("in")}
                  style={({ pressed }) => [styles.button, { backgroundColor: colors.success, flex: 1, opacity: pressed ? 0.88 : 1 }]}
                >
                  <Text className="text-base font-semibold text-background">Entrada</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleMovement("out")}
                  style={({ pressed }) => [styles.button, { backgroundColor: colors.warning, flex: 1, opacity: pressed ? 0.88 : 1 }]}
                >
                  <Text className="text-base font-semibold text-background">Saída</Text>
                </Pressable>
              </View>
            </>
          ) : barcodeValue ? (
            <Text className="mt-3 text-sm leading-6 text-warning">
              Produto ainda não cadastrado. Cadastre o item na aba de inventário para usar o reconhecimento automático.
            </Text>
          ) : (
            <Text className="mt-3 text-sm leading-6 text-muted">Nenhum código lido ainda.</Text>
          )}

          <Pressable
            onPress={() => setLocked(false)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderWidth: 1,
                marginTop: 14,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Text className="text-base font-semibold text-foreground">Liberar nova leitura</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
