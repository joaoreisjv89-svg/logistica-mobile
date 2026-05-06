import { ScrollView, Text, View, Pressable, StyleSheet, Modal, TextInput, Alert } from "react-native";
import { useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
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
  cameraContainer: {
    width: "100%",
    height: 400,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  input: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
});

export default function ScannerScreen() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const { state, moveStock } = useLogistics();
  const [showCamera, setShowCamera] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [movementType, setMovementType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("1");
  const [showModal, setShowModal] = useState(false);

  const handleBarcodeScanned = (result: any) => {
    setScannedCode(result.data);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowCamera(false);
    setShowModal(true);
  };

  const handleRequestPermission = async () => {
    const { granted } = await requestPermission();
    if (granted) {
      setShowCamera(true);
    } else {
      Alert.alert("Permissão negada", "Precisamos de acesso à câmera para escanear códigos");
    }
  };

  const handleRegisterMovement = async () => {
    if (!scannedCode.trim()) {
      Alert.alert("Erro", "Código não foi capturado");
      return;
    }

    const product = state.products.find((p) => p.code === scannedCode);
    if (!product) {
      Alert.alert("Erro", "Produto não encontrado no estoque");
      return;
    }

    try {
      await moveStock({
        productId: product.id,
        type: movementType,
        quantity: parseInt(quantity) || 1,
        notes: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Sucesso", `${movementType === "in" ? "Entrada" : "Saída"} registrada!`);
      setScannedCode("");
      setQuantity("1");
      setShowModal(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao registrar movimento");
    }
  };

  if (!permission) {
    return (
      <ScreenContainer className="px-4 pb-6 justify-center">
        <Text className="text-center text-foreground mb-4">Permissão de câmera necessária</Text>
        <Pressable
          onPress={handleRequestPermission}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.background, fontWeight: "600" }}>Conceder Acesso</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="px-4 pb-6 justify-center">
        <Text className="text-center text-foreground mb-4">Permissão de câmera não concedida</Text>
        <Pressable
          onPress={handleRequestPermission}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.background, fontWeight: "600" }}>Solicitar Permissão</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="px-4 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Scanner</Text>
          <Text className="mt-2 text-sm text-muted">Escaneie códigos de barras</Text>
        </View>

        {showCamera && (
          <View style={styles.cameraContainer}>
            <CameraView
              style={{ flex: 1 }}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
              }}
            />
          </View>
        )}

        {!showCamera && (
          <>
            <Pressable
              onPress={handleRequestPermission}
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 16 }]}
            >
              <Text style={{ color: colors.background, fontWeight: "600", fontSize: 16 }}>
                📷 Abrir Câmera
              </Text>
            </Pressable>

            {scannedCode && (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <Text className="text-sm text-muted">Último código escaneado:</Text>
                <Text className="text-lg font-bold text-foreground mt-2">{scannedCode}</Text>
              </View>
            )}

            <View className="mt-4 mb-20">
              <Text className="text-sm font-semibold text-foreground mb-3">Movimentos Recentes</Text>
              {state.movements.length === 0 ? (
                <Text className="text-center text-muted">Nenhum movimento registrado</Text>
              ) : (
                state.movements.slice(-5).reverse().map((mov) => (
                  <View
                    key={mov.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text className="text-sm font-semibold text-foreground">
                      {mov.type === "in" ? "📥 Entrada" : "📤 Saída"}: {mov.quantity}x
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      {new Date(mov.createdAt).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
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
            <Text className="text-xl font-bold text-foreground mb-4">Registrar Movimento</Text>

            <View style={{ marginBottom: 16 }}>
              <Text className="text-sm font-semibold text-foreground mb-2">Código: {scannedCode}</Text>
              <Text className="text-sm text-muted">
                Produto: {state.products.find((p) => p.code === scannedCode)?.name || "Não encontrado"}
              </Text>
            </View>

            <Text className="text-sm font-semibold text-foreground mb-3">Tipo de Movimento</Text>
            <View className="flex-row gap-2 mb-4">
              <Pressable
                onPress={() => setMovementType("in")}
                style={[
                  styles.button,
                  {
                    flex: 1,
                    backgroundColor: movementType === "in" ? colors.success : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: movementType === "in" ? colors.background : colors.foreground, fontWeight: "600" }}>
                  📥 Entrada
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMovementType("out")}
                style={[
                  styles.button,
                  {
                    flex: 1,
                    backgroundColor: movementType === "out" ? colors.error : colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: movementType === "out" ? colors.background : colors.foreground, fontWeight: "600" }}>
                  📤 Saída
                </Text>
              </Pressable>
            </View>

            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Quantidade"
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
              ]}
            />

            <Pressable
              onPress={handleRegisterMovement}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.background, fontWeight: "600" }}>Registrar</Text>
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
