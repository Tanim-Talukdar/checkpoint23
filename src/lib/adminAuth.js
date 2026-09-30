import jwt from "jsonwebtoken";

const getSecret = () => process.env.ADMIN_JWT_SECRET || null;

export function createAdminToken(admin) {
  const secret = getSecret();

  if (!secret) {
    throw new Error("Admin authentication is not configured");
  }

  return jwt.sign(
    {
      adminId: admin._id.toString(),
      role: admin.role,
    },
    secret,
    { expiresIn: "1d" }
  );
}

export function verifyAdminToken(token) {
  const secret = getSecret();

  if (!secret || !token) return null;

  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}