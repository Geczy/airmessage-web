import { PlatformUtils } from "lib/interface/platform/platformUtils";

export default class BrowserPlatformUtils extends PlatformUtils {
  initializeActivations() {}

  getChatActivationEmitter() {
    return undefined;
  }

  hasFocus() {
    return Promise.resolve(document.visibilityState === "visible");
  }

  getExtraEmailDetails() {
    return Promise.resolve({});
  }
}
