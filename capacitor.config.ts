import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;

if (!serverUrl) {
  throw new Error(
    "CAPACITOR_SERVER_URL is required. Build the APK with the HTTPS URL of the deployed Albert's AI Song Studio web app."
  );
}

const parsedUrl = new URL(serverUrl);
if (parsedUrl.protocol !== "https:") {
  throw new Error("CAPACITOR_SERVER_URL must use HTTPS.");
}

const config: CapacitorConfig = {
  appId: "com.albertnainar.wavecraft",
  appName: "Albert's AI Song Studio",
  webDir: "android-shell",
  server: {
    url: parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, ""),
    cleartext: false,
    androidScheme: "https"
  }
};

export default config;
