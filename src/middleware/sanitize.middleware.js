/**
 * Recursively strips keys starting with "$" or containing "." from request
 * body/query/params to prevent NoSQL operator injection
 * (e.g. { email: { "$gt": "" } } used to bypass a login check).
 */
const stripDangerousKeys = (obj) => {
  if (Array.isArray(obj)) {
    obj.forEach(stripDangerousKeys);
    return obj;
  }

  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
        continue;
      }
      stripDangerousKeys(obj[key]);
    }
  }

  return obj;
};

export const sanitizeBody = (req, res, next) => {
  if (req.body) stripDangerousKeys(req.body);
  if (req.params) stripDangerousKeys(req.params);
  next();
};
