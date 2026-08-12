export default function InstallAppPrompt() {
  // The browser owns the install UI. We intentionally do not cancel the
  // beforeinstallprompt event here, so a dismissed/custom UI cannot leave a
  // canceled install event that was never prompted.
  return null;
}
