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
  roleLabel?: string | null;
  grantedPermissions: string[];
  deniedPermissions: string[];
};

export async function createAdminSession(admin: {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  roleLabel?: string | null;
  grantedPermissions?: string[];
  deniedPermissions?: string[];
}) {
  const token = await new SignJWT({
    email: admin.email,
    name: admin.name,
    role: admin.role,
    roleLabel: admin.roleLabel ?? null,
    grantedPermissions: admin.grantedPermissions ?? [],
    deniedPermissions: admin.deniedPermissions ?? [],
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
    const session = {
      sub: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as AdminRole,
      roleLabel: null,
      grantedPermissions: [],
      deniedPermissions: [],
    };
    const admin = await db.adminUser.findUnique({
      where: { id: session.sub },
      select: {
        active: true,
        role: true,
        roleLabel: true,
        grantedPermissions: true,
        deniedPermissions: true,
      },
    });
    if (!admin?.active) return null;
    return {
      ...session,
      role: admin.role,
      roleLabel: admin.roleLabel,
      grantedPermissions: admin.grantedPermissions,
      deniedPermissions: admin.deniedPermissions,
    };
  } catch {
    return null;
  }
}

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["*"],
  admin: [
    "catalog",
    "content",
    "promotions",
    "orders",
    "customers",
    "inventory",
    "offline-sales",
    "purchases",
    "barcodes",
    "reports",
  ],
  sub_admin: [],
  catalog_manager: ["catalog"],
  content_manager: ["content", "promotions"],
  inventory_manager: ["inventory", "barcodes", "purchases"],
  order_manager: ["orders", "customers", "inventory"],
  supervisor: ["orders", "customers", "inventory:read", "reports", "offline-sales:read", "purchases:read"],
  accounts_manager: ["orders:read", "customers:read", "promotions:read", "purchases", "reports"],
  store_staff: ["offline-sales", "barcodes:read", "inventory:read", "customers:read"],
  support: ["orders:read", "customers:read"],
};

export function hasPermission(
  role: AdminRole,
  permission: string,
  overrides?: { grantedPermissions?: string[]; deniedPermissions?: string[] },
): boolean {
  const grants = new Set(ROLE_PERMISSIONS[role] ?? []);
  const granted = overrides?.grantedPermissions ?? [];
  const denied = new Set(overrides?.deniedPermissions ?? []);
  if (grants.has("*")) return !denied.has(permission) && !denied.has(permission.split(":")[0]);
  if (granted.includes("*")) return !denied.has(permission) && !denied.has(permission.split(":")[0]);
  if (denied.has(permission) || denied.has(permission.split(":")[0])) return false;
  if (grants.has(permission) || granted.includes(permission)) return true;
  // an unscoped grant like "orders" covers scoped permissions like "orders:read"
  const scope = permission.split(":")[0];
  return grants.has(scope) || granted.includes(scope);
}

export async function requireAdmin(permission?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (
    permission &&
    !hasPermission(session.role, permission, {
      grantedPermissions: session.grantedPermissions,
      deniedPermissions: session.deniedPermissions,
    })
  ) {
    redirect("/admin");
  }
  return session;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const bcrypt = await import("bcryptjs");
  const admin = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!admin || !admin.active) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  return ok ? admin : null;
}
