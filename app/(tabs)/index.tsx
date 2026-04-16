import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { DashboardCard, QuickActionCard } from "@/components/logistics/dashboard-card";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useLogistics } from "@/lib/logistics/provider";
import { DELIVERY_STATUS_LABEL, MOVEMENT_TYPE_LABEL } from "@/lib/logistics/types";

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { state } = useLogistics();

  const stockSummary = useMemo(() => {
    if (state.dashboard.metrics.totalProductsInStock === 0) {
      return "Nenhum item cadastrado";
    }

    return `${state.dashboard.metrics.totalProductsInStock} unidades em estoque`;
  }, [state.dashboard.metrics.totalProductsInStock]);

  return (
    <ScreenContainer className="px-5 pb-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="pt-4">
          <Text className="text-3xl font-bold text-foreground">Painel operacional</Text>
          <Text className="mt-2 text-base leading-6 text-muted">
            Acompanhe entregas, movimentações de inventário e atalhos rápidos para operação diária.
          </Text>
        </View>

        <View className="mt-6 flex-row gap-3">
          <DashboardCard label="Entregas hoje" value={String(state.dashboard.metrics.deliveriesToday)} tone="primary" />
          <DashboardCard label="Escaneados hoje" value={String(state.dashboard.metrics.productsScannedToday)} tone="success" />
        </View>

        <View className="mt-3 flex-row gap-3">
          <DashboardCard label="Pendentes" value={String(state.dashboard.metrics.pendingDeliveries)} tone="warning" />
          <DashboardCard label="Concluídas" value={String(state.dashboard.metrics.completedDeliveries)} tone="success" />
        </View>

        <View
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          className="mt-4 rounded-3xl border px-4 py-4"
        >
          <Text className="text-base font-semibold text-foreground">Visão de estoque</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">{stockSummary}</Text>
          <Text className="mt-1 text-sm leading-6 text-muted">
            {state.dashboard.metrics.lowStockProducts} item(ns) com nível baixo e exigindo reposição.
          </Text>
        </View>

        <View className="mt-7">
          <Text className="text-xl font-semibold text-foreground">Ações rápidas</Text>
          <View className="mt-3 flex-row flex-wrap justify-between gap-y-3">
            <QuickActionCard title="Escanear produto" subtitle="Abrir câmera para leitura rápida de código." onPress={() => router.push("/scanner")} />
            <QuickActionCard title="Novo produto" subtitle="Cadastrar item e atualizar o inventário." onPress={() => router.push("/inventory")} />
            <QuickActionCard title="Nova entrega" subtitle="Registrar pedido com cliente e endereço." onPress={() => router.push("/deliveries")} />
            <QuickActionCard title="Relatórios" subtitle="Consultar indicadores e preparar exportações." onPress={() => router.push("/reports")} />
          </View>
        </View>

        <View className="mt-7">
          <Text className="text-xl font-semibold text-foreground">Movimentações recentes</Text>
          <View className="mt-3 gap-3">
            {state.dashboard.recentMovements.length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl border px-4 py-5">
                <Text className="text-sm leading-6 text-muted">
                  Ainda não há movimentações registradas. Cadastre um produto ou faça uma leitura no scanner para iniciar a operação.
                </Text>
              </View>
            ) : (
              state.dashboard.recentMovements.map((movement) => (
                <View
                  key={movement.id}
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  className="rounded-3xl border px-4 py-4"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-base font-semibold text-foreground">{movement.productName}</Text>
                    <Text className="text-sm font-semibold text-primary">{MOVEMENT_TYPE_LABEL[movement.type]}</Text>
                  </View>
                  <Text className="mt-1 text-sm text-muted">Código {movement.productCode}</Text>
                  <Text className="mt-2 text-sm leading-6 text-muted">Quantidade movimentada: {movement.quantity}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View className="mt-7">
          <Text className="text-xl font-semibold text-foreground">Próximas entregas</Text>
          <View className="mt-3 gap-3">
            {state.dashboard.nextDeliveries.length === 0 ? (
              <View style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="rounded-3xl border px-4 py-5">
                <Text className="text-sm leading-6 text-muted">
                  Nenhuma entrega pendente no momento. Quando uma entrega for cadastrada, ela aparecerá aqui.
                </Text>
              </View>
            ) : (
              state.dashboard.nextDeliveries.map((delivery) => (
                <View
                  key={delivery.id}
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  className="rounded-3xl border px-4 py-4"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="flex-1 text-base font-semibold text-foreground">{delivery.customerName}</Text>
                    <Text className="text-sm font-semibold text-primary">{DELIVERY_STATUS_LABEL[delivery.status]}</Text>
                  </View>
                  <Text className="mt-2 text-sm leading-6 text-muted">{delivery.address}</Text>
                  <Text className="mt-1 text-sm text-muted">{delivery.assignedProductCount} item(ns) vinculados</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
