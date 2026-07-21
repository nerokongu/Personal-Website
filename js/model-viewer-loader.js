let modelViewerPromise = null;

export function ensureModelViewer() {
  if (customElements.get("model-viewer")) {
    return Promise.resolve();
  }

  if (modelViewerPromise) {
    return modelViewerPromise;
  }

  modelViewerPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-model-viewer-loader="true"]'
    );

    if (existing) {
      customElements.whenDefined("model-viewer").then(resolve).catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.dataset.modelViewerLoader = "true";

    script.addEventListener("load", () => {
      customElements.whenDefined("model-viewer").then(resolve).catch(reject);
    }, { once: true });

    script.addEventListener("error", () => {
      modelViewerPromise = null;
      reject(new Error("Không load được model-viewer."));
    }, { once: true });

    document.head.appendChild(script);
  });

  return modelViewerPromise;
}
