function ensureTrailingSlash(value: string) {
  if (!value.trim()) {
    return "./";
  }

  return value.endsWith("/") ? value : `${value}/`;
}

export function resolveAppBaseHref() {
  if (typeof document === "undefined") {
    return "./";
  }

  const meta = document.querySelector('meta[name="app-base"]');
  const content = meta?.getAttribute("content") ?? "./";
  return ensureTrailingSlash(content.trim() || "./");
}
