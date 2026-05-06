import { Redirect } from "expo-router";

export default function RootIndex() {
  // Redirect to the tabs layout
  return <Redirect href="/(tabs)/estoque" />;
}
