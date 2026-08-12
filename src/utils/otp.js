/** Generates a random 6-digit numeric OTP as a string, e.g. "042917". */
export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

/** Returns the Date at which a freshly-generated OTP should expire. */
export const getOtpExpiry = () => {
  const minutes = Number(process.env.OTP_EXPIRY_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};
