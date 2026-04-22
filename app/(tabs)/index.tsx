import { ScrollView, Text, View, TouchableOpacity, FlatList, Modal, TextInput, Alert } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useLogistics } from "@/lib/logistics/provider";
import { useColors } from "@/hooks/use-colors";

export default function EstoqueScreen() {
  const colors = useColors();
  const { state, saveProduct, removeProduct } = useLogistics();
  const [searchText, setSearchText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", code: "", category: "Outros", quantity: "0" });

  const filteredProducts = state.products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddProduct = () => {
    if (!formData.name || !formData.code) {
      Alert.alert("Erro", "Nome e código são obrigatórios");
      return;
    }
    saveProduct({
      name: formData.name,
      code: formData.code,
      category: formData.category as any,
      quantity: parseInt(formData.quantity) || 0,
      notes: "",
    });
    setFormData({ name: "", code: "", category: "Outros", quantity: "0" });
    setShowAddModal(false);
  };

  const handleEditProduct = () => {
    if (!formData.name || !formData.code) {
      Alert.alert("Erro", "Nome e código são obrigatórios");
      return;
    }
    saveProduct({
      name: formData.name,
      code: formData.code,
      category: formData.category as any,
      quantity: parseInt(formData.quantity) || 0,
      notes: "",
    });
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    Alert.alert("Confirmar", "Deseja deletar este produto?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Deletar",
        onPress: () => removeProduct(id),
        style: "destructive",
      },
    ]);
  };

  const openEditModal = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      category: product.category,
      quantity: product.quantity.toString(),
    });
    setShowEditModal(true);
  };

  const totalQuantity = state.products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <ScreenContainer className="bg-background flex-1">
      {/* Header com Logo e Título */}
      <View className="px-4 py-3 bg-primary">
        <Text className="text-white text-2xl font-bold">LogiStock PRO</Text>
        <Text className="text-blue-100 text-sm">Gestão de Estoque</Text>
      </View>

      {/* Estatísticas */}
      <View className="flex-row gap-2 px-4 py-3 bg-surface">
        <View className="flex-1 bg-background rounded-lg p-3 border border-border">
          <Text className="text-muted text-xs">Total Produtos</Text>
          <Text className="text-primary text-2xl font-bold">{state.products.length}</Text>
        </View>
        <View className="flex-1 bg-background rounded-lg p-3 border border-border">
          <Text className="text-muted text-xs">Qtd Total</Text>
          <Text className="text-success text-lg font-bold">{totalQuantity}</Text>
        </View>
      </View>

      {/* Barra de Busca */}
      <View className="px-4 py-3">
        <TextInput
          placeholder="Buscar produto..."
          value={searchText}
          onChangeText={setSearchText}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
          placeholderTextColor={colors.muted}
        />
      </View>

      {/* Lista de Produtos */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        className="px-4 pb-4"
        renderItem={({ item }) => (
          <View className="bg-surface border border-border rounded-lg p-3 mb-2">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item.name}</Text>
                <Text className="text-muted text-xs">Código: {item.code}</Text>
              </View>
              <Text className="text-primary font-bold text-xs">{item.category}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-muted">Qtd: {item.quantity}</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  className="bg-primary px-3 py-1 rounded"
                >
                  <Text className="text-white text-xs font-semibold">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteProduct(item.id)}
                  className="bg-error px-3 py-1 rounded"
                >
                  <Text className="text-white text-xs font-semibold">Deletar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Botão Adicionar */}
      <TouchableOpacity
        onPress={() => {
          setFormData({ name: "", code: "", category: "Outros", quantity: "0" });
          setShowAddModal(true);
        }}
        className="mx-4 mb-4 bg-success py-3 rounded-lg"
      >
        <Text className="text-white text-center font-bold">+ Adicionar Produto</Text>
      </TouchableOpacity>

      {/* Modal Adicionar */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-4">
            <Text className="text-foreground text-lg font-bold mb-4">Novo Produto</Text>
            <TextInput
              placeholder="Nome do produto"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Código do produto"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Quantidade"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
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
                onPress={handleAddProduct}
                className="flex-1 bg-success py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-4">
            <Text className="text-foreground text-lg font-bold mb-4">Editar Produto</Text>
            <TextInput
              placeholder="Nome do produto"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Código do produto"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-3 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              placeholder="Quantidade"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
              className="bg-surface border border-border rounded-lg px-3 py-2 mb-4 text-foreground"
              placeholderTextColor={colors.muted}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                className="flex-1 bg-border py-3 rounded-lg"
              >
                <Text className="text-foreground text-center font-semibold">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditProduct}
                className="flex-1 bg-primary py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Atualizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
