const GITHUB_PAGES_BACKEND = "https://salesiq-backend.onrender.com";

export function getApiBaseUrl() {
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl;
  }

  const hostname = window.location.hostname;
  const savedOverride = window.localStorage.getItem("salesiq_api_base_url");
  if (savedOverride) {
    return savedOverride;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000";
  }

  if (hostname.endsWith("github.io")) {
    return GITHUB_PAGES_BACKEND;
  }

  return GITHUB_PAGES_BACKEND;
}

export function getWebSocketBaseUrl(apiBaseUrl) {
  return apiBaseUrl ? apiBaseUrl.replace(/^http/, "ws") : "";
}
