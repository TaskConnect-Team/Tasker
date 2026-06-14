export const buildCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge,
  path: "/",
});

export const buildClearCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "none",
  expires: new Date(0),
  path: "/",
});
