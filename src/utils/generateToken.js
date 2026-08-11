import jwt from "jsonwebtoken";

/**
 * Signs a JWT for the given user id and sets it as an HTTP-only cookie
 * on the response. Cookie is `secure` + `sameSite: none` in production
 * (cross-site), and lax in development so it works on localhost over http.
 */
export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const cookieExpiresDays = Number(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7;
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: cookieExpiresDays * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return token;
};

export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};
