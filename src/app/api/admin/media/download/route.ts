import { NextResponse } from "next/server";
import { getAdminSession, hasPermission } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "catalog")) {
    return NextResponse.json({ ok: false, error: "Not authorised." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ ok: false, error: "Missing media URL." }, { status: 400 });
  }

  let mediaUrl: URL;
  try {
    mediaUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid media URL." }, { status: 400 });
  }

  if (!["http:", "https:"].includes(mediaUrl.protocol)) {
    return NextResponse.json({ ok: false, error: "Unsupported media URL." }, { status: 400 });
  }

  const response = await fetch(mediaUrl.toString(), { cache: "no-store" });
  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "Could not fetch media." }, { status: 400 });
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const filename = mediaUrl.pathname.split("/").pop() || "product-media";
  return new NextResponse(response.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
