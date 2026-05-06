import { ScrollView, Text, View, Pressable, StyleSheet, Modal, TextInput, Alert } from "react-native";
import { useState, useMemo } from "react";
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
  input: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  productCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  searchInput: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 14,
  },
});

export default function EstoqueScreen() {
  const colors = useColors();
  const { state, saveProduct, removeProduct } = useLogistics();
  const [searchText, setSearchText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "", quantity: "0" });

  const filteredProducts = useMemo(() => {
    if (!searchText.trim()) return state.products;
    const lower = searchText.toLowerCase();
    return state.products.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.code.toLowerCase().includes(lower)
    );
  }, [state.products, searchText]);

  const handleOpenModal = (product?: typeof state.products[0]) => {
    if (product) {
      setEditingId(product.id);
      setFormData({ name: product.name, code: product.code, quantity: product.quantity.toString() });
    } else {
      setEditingId(null);
      setFormData({ name: "", code: "", quantity: "0" });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      Alert.alert("Erro", "Preencha nome e código do produto");
      return;
    }

    try {
      await saveProduct({
        name: formData.name,
        code: formData.code,
        quantity: parseInt(formData.quantity) || 0,
        category: "Outros",
        notes: "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowModal(false);
    } catch (error) {
      Alert.alert("Erro", "Falha ao salvar produto");
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Confirmar", "Deseja remover este produto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await removeProduct(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            Alert.alert("Erro", "Falha ao remover produto");
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-4 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Estoque</Text>
          <Text className="mt-2 text-sm text-muted">Gerencie seus produtos</Text>
        </View>

        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar produto..."
          placeholderTextColor={colors.muted}
          style={[
            styles.searchInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
          ]}
        />

        <Pressable
          onPress={() => handleOpenModal()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: colors.background, fontWeight: "600", fontSize: 16 }}>+ Adicionar Produto</Text>
        </Pressable>

        <View className="mb-20">
          {filteredProducts.length === 0 ? (
            <Text className="text-center text-muted mt-8">Nenhum produto cadastrado</Text>
          ) : (
            filteredProducts.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => handleOpenModal(product)}
                style={[
                  styles.productCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text className="font-semibold text-foreground">{product.name}</Text>
                <Text className="text-sm text-muted mt-1">Código: {product.code}</Text>
                <Text className="text-sm text-muted mt-1">Quantidade: {product.quantity}</Text>
                <Pressable
                  onPress={() => handleDelete(product.id)}
                  style={{ marginTop: 8 }}
                >
                  <Text className="text-error text-sm font-semibold">Remover</Text>
                </Pressable>
              </Pressable>
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
            <Text className="text-xl font-bold text-foreground mb-4">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </Text>

            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Nome do produto"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
              ]}
            />

            <TextInput
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              placeholder="Código/SKU"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
              ]}
            />

            <TextInput
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholder="Quantidade"
              keyboardType="numeric"
              placeholderTextColor={colors.muted}
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, borderWidth: 1 },
              ]}
            />

            <Pressable
              onPress={handleSave}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.background, fontWeight: "600" }}>Salvar</Text>
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
