import jwt from "jsonwebtoken";

export const generateToken = (userId, res, { remember = false } = {}) => {
  // 7d if remember, else session cookie (~12h) configurable
  const expiresDays = remember ? 7 : 0; // 0 -> use shorter expiry below
  const jwtExpiry = remember ? '7d' : '12h';
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: jwtExpiry });

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV !== 'development',
  };
  if (remember) {
    cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  } else {
    cookieOptions.maxAge = 12 * 60 * 60 * 1000; // 12 hours
  }

  res.cookie('jwt', token, cookieOptions);
  return token;
};
