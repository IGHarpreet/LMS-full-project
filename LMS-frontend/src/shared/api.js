import axios from "axios";
import { message } from "antd";
import { getToken } from "../utils/auth";

export const BASE_URL = (process.env.REACT_APP_BASE_URL || "http://localhost:1999")
  .trim()
  .replace(/\/+$/, "");

let lastNetworkToast = 0;

/** Turn any axios/fetch error into a short, human sentence. */
export const getErrorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err) return fallback;
  if (err.response) {
    return (
      err.response.data?.msg ||
      err.response.data?.message ||
      err.response.data?.error ||
      `Request failed (${err.response.status})`
    );
  }
  if (err.code === "ERR_NETWORK" || /network|fetch/i.test(err.message || "")) {
    return "Cannot reach the server. Check your connection or try again shortly.";
  }
  return err.message || fallback;
};

/**
 * Global axios behaviour (applies to every existing `axios.get/post/...` call):
 *  - attaches the bearer token automatically
 *  - shows ONE friendly toast per few seconds when the server is unreachable
 *  - sends the user back to login when the token is rejected (401)
 */
export const setupAxios = () => {
  if (axios.__ebsConfigured) return;
  axios.__ebsConfigured = true;
  axios.defaults.timeout = 20000;

  axios.interceptors.request.use((config) => {
    const token = getToken();
    if (token && !config.headers?.Authorization) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
    }
    return config;
  });

  axios.interceptors.response.use(
    (res) => res,
    (error) => {
      error.handledByUI = true;
      if (!error.response) {
        if (Date.now() - lastNetworkToast > 5000) {
          lastNetworkToast = Date.now();
          message.error(getErrorMessage(error));
        }
      } else if (error.response.status === 401 && getToken()) {
        const url = error.config?.url || "";
        if (!/\/user\/login/.test(url)) {
          localStorage.removeItem("access_token1");
          message.warning("Your session has expired. Please sign in again.");
          setTimeout(() => window.location.assign("/"), 800);
        }
      }
      return Promise.reject(error);
    }
  );

  // Stop already-handled request failures from triggering the red
  // "Uncaught runtime errors" overlay during development.
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const r = event.reason;
      if (r && (r.handledByUI || r.isAxiosError || /failed to fetch|network/i.test(r.message || ""))) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
};

/** Small wrapper for the few places that use fetch(): never throws, always returns JSON or null. */
export const safeFetchJson = async (path, options = {}) => {
  try {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`GET ${path} failed:`, err.message);
    return null;
  }
};

export default axios;
