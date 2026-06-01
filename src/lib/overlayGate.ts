let blockExitIntent = false;

/** While a higher-priority overlay (e.g. PWA install modal) is open, exit-intent prompts stay suppressed. */
export function setExitIntentSuppressed(value: boolean) {
  blockExitIntent = value;
}

export function isExitIntentSuppressed() {
  return blockExitIntent;
}
