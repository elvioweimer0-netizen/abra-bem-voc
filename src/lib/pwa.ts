export function isPreviewOrIframe() {
  const isIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  return isIframe || host.includes("id-preview--") || host.includes("lovableproject.com") || host.includes("localhost");
}

export function setupServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (isPreviewOrIframe()) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}