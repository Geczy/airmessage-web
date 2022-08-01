import { createCallbackManager } from "lib/util/callbacks";
import { getHotkeyMatcher } from "lib/util/parseHotkey";
import { useEffect } from "react";

const IGNORE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

const handlers = createCallbackManager();

export function useHotkeys(
  hotkeys?: Record<string, (e: KeyboardEvent) => void>
) {
  useEffect(() => {
    document.documentElement.addEventListener("keydown", handlers.runCallbacks);

    if (!hotkeys) {
      return undefined;
    }

    const entries = Object.entries(hotkeys);

    function handleKeyDown(e: KeyboardEvent) {
      if (!shouldFireEvent(e)) {
        return;
      }

      entries.forEach(([hotkey, handler]) => {
        if (getHotkeyMatcher(hotkey)(e)) {
          handler(e);
        }
      });
    }

    return handlers.addCallback(handleKeyDown);
  }, [hotkeys]);
}

function shouldFireEvent(e: KeyboardEvent) {
  if (e.target instanceof HTMLElement) {
    return !IGNORE_TAGS.has(e.target.tagName);
  }

  return true;
}
