import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { optimizeRouteStops } from "@/lib/logistics/helpers";
import { openExternalRoute } from "@/lib/logistics/location";
import { useLogistics } from "@/lib/logistics/provider";
import type { RouteStop } from "@/lib/logistics/types";

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function WebMapScreen() {
  const colors = useColors();
  const { optimizeRoute, setLastError } = useLogistics();
  const [stops, setStops] = useState<RouteStop[]>([]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const route = await optimizeRoute();
        setStops(optimizeRouteStops(route));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível carregar a rota operacional.";
        setLastError(message);
      }
    }

    bootstrap();
  }, [optimizeRoute, setLastError]);

  async function handleOpenRoute() {
    try {
      await openExternalRoute(stops);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível abrir a rota externa.";
      setLastError(message);
    }
  }

  return (
    <ScreenContainer className="px-5 pb-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 72 }}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Mapa e rota</Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            No ambiente web, a visualização é apresentada como lista sequencial. Em Android, a mesma rota usa mapa nativo.
          </Text>
        </View>

        <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="mt-6 rounded-3xl border px-4 py-5">
          <Text className="text-base font-semibold text-foreground">Sequência otimizada</Text>
          <View className="mt-4 gap-3">
            {stops.length === 0 ? (
              <Text className="text-sm leading-6 text-muted">Nenhuma entrega pendente com rota disponível no momento.</Text>
            ) : (
              stops.map((stop) => (
                <View key={stop.deliveryId} className="flex-row items-start gap-3">
                  <View style={{ backgroundColor: colors.primary }} className="h-8 w-8 items-center justify-center rounded-full">
                    <Text className="text-sm font-semibold text-background">{stop.sequence}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{stop.customerName}</Text>
                    <Text className="mt-1 text-sm leading-6 text-muted">{stop.address}</Text>
                    <Text className="mt-1 text-sm text-muted">ETA estimado: {stop.estimatedMinutes} min</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <Pressable
            onPress={handleOpenRoute}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.primary,
                marginTop: 16,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text className="text-base font-semibold text-background">Abrir rota no Google Maps</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
