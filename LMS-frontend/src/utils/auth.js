import jwt_decode, { cleanToken } from "./jwtSafe";

const TOKEN_KEY = "access_token1";

export const getToken = () => cleanToken(localStorage.getItem(TOKEN_KEY));

export const getUser = () => {
  const token = getToken();
  if (!token) return null;
  const decoded = jwt_decode(token);
  if (!decoded || !decoded._id) return null;
  // expired token?
  if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
  return decoded;
};

export const isLoggedIn = () => !!getUser();

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.clear();
  window.location.assign("/");
};
