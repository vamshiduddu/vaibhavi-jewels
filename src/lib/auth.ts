import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { AdminRole } from "@prisma/client";
import { db } from "@/lib/db";

const COOKIE_NAME = "vj_admin";
const SESSION_HOURS = 12;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
};

export async function createAdminSession(admin: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}) {
  const token = await new SignJWT({
    email: admin.email,
    name: admin.name,
    role: admin.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function destroyAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as AdminRole,
    };
  } catch {
    return null;
  }
}

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["*"],
  catalog_manager: ["catalog", "content", "promotions"],
  order_manager: ["orders", "customers", "inventory"],
  support: ["orders:read", "customers:read"],
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  const grants = ROLE_PERMISSIONS[role] ?? [];
  if (grants.includes("*") || grants.includes(permission)) return true;
  // an unscoped grant like "orders" covers scoped permissions like "orders:read"
  return grants.includes(permission.split(":")[0]);
}

export async function requireAdmin(permission?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (permission && !hasPermission(session.role, permission)) redirect("/admin");
  return session;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const bcrypt = await import("bcryptjs");
  const admin = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!admin || !admin.active) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  return ok ? admin : null;
}
