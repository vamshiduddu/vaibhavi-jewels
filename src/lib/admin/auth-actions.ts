"use server";

import { redirect } from "next/navigation";
import { createAdminSession, destroyAdminSession, verifyAdminCredentials } from "@/lib/auth";

export async function adminLogin(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const admin = await verifyAdminCredentials(email, password);
  if (!admin) {
    return { error: "Invalid email or password." };
  }
  await createAdminSession(admin);
  redirect("/admin");
}

export async function adminLogout() {
  await destroyAdminSession();
  redirect("/admin/login");
}
