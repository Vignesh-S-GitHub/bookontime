import { Capacitor, registerPlugin } from "@capacitor/core";

export const nativeAndroid = Capacitor.getPlatform() === "android";
export const offlineBuild = import.meta.env.MODE === "android";
export const offlineApp = nativeAndroid || offlineBuild;
export const Documents = registerPlugin<{
  exportFile(options: {
    name: string;
    content: string;
    mime: string;
  }): Promise<void>;
  importFile(): Promise<{ content: string }>;
  openSettings(): Promise<void>;
}>("OfflineDocuments");
