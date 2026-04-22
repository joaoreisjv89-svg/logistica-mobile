import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ESTOQUE",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="cube.box" color={color} />,
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: "ENTREGAS",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="truck.box" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "SCANNER",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="qrcode.viewfinder" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "RELATÓRIOS",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar" color={color} />,
        }}
      />
    </Tabs>
  );
}
