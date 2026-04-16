import { Linking, Platform } from "react-native";
import * as Location from "expo-location";

import { buildGoogleMapsUrl } from "@/lib/logistics/helpers";
import type { RouteStop } from "@/lib/logistics/types";

export interface CurrentCoordinate {
  latitude: number;
  longitude: number;
}

export async function getCurrentCoordinate() {
  if (Platform.OS === "web" && !globalThis.navigator?.geolocation) {
    throw new Error("Geolocalização indisponível neste ambiente.");
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Ative o GPS do dispositivo para continuar.");
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("A permissão de localização foi negada.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  } satisfies CurrentCoordinate;
}

export async function openExternalRoute(stops: RouteStop[]) {
  const { url, optimized } = buildGoogleMapsUrl(stops);
  const supported = await Linking.canOpenURL(url);

  if (!supported) {
    throw new Error("Não foi possível abrir o trajeto no Google Maps.");
  }

  await Linking.openURL(url);
  return optimized;
}
