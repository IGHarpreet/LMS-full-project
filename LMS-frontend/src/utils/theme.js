/**
 * Theme helpers – the single place that knows how the app theme is stored,
 * validated and applied to the document.
 *
 *  - localStorage key : "ebs-theme"  ("light" | "dark")
 *  - <html>           : data-theme="light" | "dark"   (drives html[data-theme="dark"] CSS)
 *  - <body>           : class "dark-theme" when dark   (kept for any code relying on it)
 *
 * Light is the default whenever the stored value is missing, empty or invalid.
 */
import { isLoggedIn } from "./auth";

export const THEME_KEY = "ebs-theme";
export const DEFAULT_THEME = "light";

/** Anything other than exactly "dark" / "light" safely becomes light. */
export const normalizeTheme = (value) =>
  value === "dark" || value === "light" ? value : DEFAULT_THEME;

/** Saved preference (validated). Never throws (e.g. storage blocked). */
export const getStoredTheme = () => {
  try {
    return normalizeTheme(localStorage.getItem(THEME_KEY));
  } catch (e) {
    return DEFAULT_THEME;
  }
};

/** Save the preference. Never throws. */
export const storeTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, normalizeTheme(theme));
  } catch (e) {
    /* storage unavailable – theme still applies for this session */
  }
};

/** Apply a theme to <html data-theme> and <body class="dark-theme">. Returns the applied value. */
export const applyThemeToDocument = (theme) => {
  const applied = normalizeTheme(theme);
  document.documentElement.setAttribute("data-theme", applied);
  if (document.body) {
    document.body.classList.toggle("dark-theme", applied === "dark");
  }
  return applied;
};

/**
 * Theme that should be visible right now.
 * The login screen (no <Top/> mounted) is designed light-only and has no dark
 * styles, so it stays light; the saved preference is NOT overwritten and is
 * applied again as soon as the user is logged in.
 */
export const getActiveTheme = () => {
  let loggedIn = false;
  try {
    loggedIn = isLoggedIn();
  } catch (e) {
    loggedIn = false;
  }
  return loggedIn ? getStoredTheme() : DEFAULT_THEME;
};

/** Call once, before React renders, so the first paint already has the right theme. */
export const initTheme = () => applyThemeToDocument(getActiveTheme());
