import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLogistics } from "@/lib/logistics/provider";
import { CATEGORY_OPTIONS, type InventoryCategory, type ProductRecord } from "@/lib/logistics/types";
import { filterProductsByTerm, validateProductDraft } from "@/lib/logistics/helpers";

const inputStyle = StyleSheet.create({
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

function ProductRow({ product }: { product: ProductRecord }) {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl border px-4 py-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 text-base font-semibold text-foreground">{product.name}</Text>
        <Text className="text-sm font-semibold text-primary">{product.quantity} un.</Text>
      </View>
      <Text className="mt-1 text-sm text-muted">Código {product.code}</Text>
      <Text className="mt-1 text-sm text-muted">Categoria {product.category}</Text>
      {product.notes ? <Text className="mt-2 text-sm leading-6 text-muted">{product.notes}</Text> : null}
    </View>
  );
}

export default function InventoryScreen() {
  const colors = useColors();
  const { state, saveProduct, setLastError } = useLogistics();
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("Outros");
  const [quantity, setQuantity] = useState("0");
  const [notes, setNotes] = useState("");

  const filteredProducts = useMemo(() => filterProductsByTerm(state.products, query), [query, state.products]);

  async function handleSaveProduct() {
    const draft = {
      code,
      name,
      category,
      quantity: Number(quantity || 0),
      notes,
    };

    const validation = validateProductDraft(draft);
    if (!validation.valid) {
      setLastError(validation.errors[0] ?? "Preencha os campos do produto corretamente.");
      return;
    }

    try {
      await saveProduct(draft);
      setCode("");
      setName("");
      setCategory("Outros");
      setQuantity("0");
      setNotes("");
    } catch {
      // handled by provider
    }
  }

  return (
    <ScreenContainer className="px-5 pb-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Inventário</Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            Cadastre produtos, pesquise itens existentes e acompanhe o saldo local do estoque offline.
          </Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-6 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Busca rápida</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por código, nome ou categoria"
            placeholderTextColor={colors.muted}
            style={[inputStyle.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-4 rounded-3xl border px-4 py-4">
          <Text className="text-base font-semibold text-foreground">Novo produto</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Código do produto"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            style={[inputStyle.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome do produto"
            placeholderTextColor={colors.muted}
            style={[inputStyle.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => {
              const selected = option === category;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  style={({ pressed }) => [
                    inputStyle.chip,
                    {
                      backgroundColor: selected ? colors.primary : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <Text className={selected ? "text-sm font-semibold text-background" : "text-sm font-semibold text-foreground"}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Quantidade inicial"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            style={[inputStyle.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12 }]}
          />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Observações operacionais"
            placeholderTextColor={colors.muted}
            multiline
            style={[inputStyle.field, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 12, minHeight: 88, textAlignVertical: "top" }]}
          />
          <Pressable
            onPress={handleSaveProduct}
            style={({ pressed }) => [
              inputStyle.button,
              {
                backgroundColor: colors.primary,
                marginTop: 14,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text className="text-base font-semibold text-background">Salvar produto</Text>
          </Pressable>
          {state.lastError ? <Text className="mt-3 text-sm leading-6 text-error">{state.lastError}</Text> : null}
        </View>

        <View className="mt-6">
          <Text className="text-xl font-semibold text-foreground">Itens cadastrados</Text>
          <View className="mt-3 gap-3">
            {filteredProducts.length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl border px-4 py-5">
                <Text className="text-sm leading-6 text-muted">
                  Nenhum produto encontrado com os filtros atuais. Cadastre um item acima para iniciar o inventário.
                </Text>
              </View>
            ) : (
              filteredProducts.map((product) => <ProductRow key={product.id} product={product} />)
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
