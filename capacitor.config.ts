import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.appstarter.app",
  appName: "app-starter",
  webDir: ".output/public",
  // Matches the WKWebView's own background (and its scrollView's) to the
  // app's real theme color, applied by CAPBridgeViewController before the
  // page loads. Without this, the webview defaults to its own loading
  // background regardless of what the launch screen or root view show,
  // producing a black flash between launch screen and real content.
  backgroundColor: "#ffffff",
};

export default config;
