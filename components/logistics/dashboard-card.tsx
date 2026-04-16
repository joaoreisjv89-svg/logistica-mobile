import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";

interface DashboardCardProps {
  label: string;
  value: string;
  tone?: "primary" | "success" | "warning" | "neutral";
}

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function DashboardCard({ label, value, tone = "neutral" }: DashboardCardProps) {
  const colors = useColors();
  const accent =
    tone === "primary"
      ? colors.primary
      : tone === "success"
        ? colors.success
        : tone === "warning"
          ? colors.warning
          : colors.border;

  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <Text className="text-sm font-medium text-muted">{label}</Text>
      <Text className="mt-2 text-2xl font-bold text-foreground">{value}</Text>
    </View>
  );
}

export function QuickActionCard({ title, subtitle, onPress }: QuickActionCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      <Text className="mt-2 text-sm leading-5 text-muted">{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 116,
    flex: 1,
    gap: 4,
  },
  metricAccent: {
    width: 40,
    height: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  actionCard: {
    minHeight: 110,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    width: "48.5%",
    justifyContent: "space-between",
  },
});
