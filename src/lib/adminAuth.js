import jwt from "jsonwebtoken";

function getAdminJwtSecret() {
  return process.env.ADMIN_JWT_SECRET || null;
}

export function createAdminToken(admin) {
  const secret = getAdminJwtSecret();

  if (!secret) {
    throw new Error(
      "Admin authentication is not configured"
    );
  }

  return jwt.sign(
    {
      adminId: admin._id.toString(),
      role: admin.role,
    },
    secret,
    {
      expiresIn: "1d",
    }
  );
}

export function verifyAdminToken(token) {
  try {
    const secret = getAdminJwtSecret();

    // Fail closed
    if (!secret || !token) {
      return null;
    }

    return jwt.verify(token, secret);
  } catch {
    // Never expose JWT errors
    return null;
  }
}