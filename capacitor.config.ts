import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bookontime.app",
  appName: "BookOnTime",
  webDir: "dist-android",
  loggingBehavior: "none",
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  server: { hostname: "localhost", androidScheme: "https", cleartext: false },
  plugins: {
    LocalNotifications: { smallIcon: "ic_stat_booking", iconColor: "#2563EB" },
  },
};
export default config;
