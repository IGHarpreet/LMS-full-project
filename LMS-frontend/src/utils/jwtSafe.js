import jwtDecode from "jwt-decode";

/**
 * Drop-in replacement for `jwt_decode`.
 * - Strips the extra quotes added by JSON.stringify() at login
 * - Never throws: returns {} when the token is missing or malformed
 *   (this removes the "Invalid token specified" crash screen)
 */
export const cleanToken = (raw) => {
  if (!raw || raw === "undefined" || raw === "null") return "";
  return String(raw).replace(/^"+|"+$/g, "");
};

const jwt_decode = (token) => {
  try {
    const cleaned = cleanToken(token);
    if (!cleaned) return {};
    return jwtDecode(cleaned) || {};
  } catch (err) {
    return {};
  }
};

export default jwt_decode;
