import { NextResponse } from "next/server";
import { getAdminSession, hasPermission } from "@/lib/auth";
import { uploadProductImage } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "catalog")) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file received." }, { status: 400 });
  }

  const result = await uploadProductImage(file);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
