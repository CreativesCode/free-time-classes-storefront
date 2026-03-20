import { loadEnvConfig } from "@next/env";
import type { CapacitorConfig } from "@capacitor/cli";

loadEnvConfig(process.cwd());

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.free.time.classes",
  appName: "Free Time Classes",
  webDir: "capacitor-www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext:
            serverUrl.startsWith("http://") ||
            process.env.CAPACITOR_ANDROID_CLEARTEXT === "true",
        },
      }
    : {}),
};

export default config;
