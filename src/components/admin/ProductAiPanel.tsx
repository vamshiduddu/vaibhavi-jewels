"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateProductAiContent } from "@/lib/admin/catalog-actions";

type Props = {
  productId: string;
  instagramCaption: string | null;
  youtubeTitle: string | null;
  youtubeDescription: string | null;
  media: Array<{ url: string; kind: string; alt: string | null }>;
};

async function copyText(value: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Ignore clipboard failures in unsupported browsers.
  }
}

export default function ProductAiPanel({
  productId,
  instagramCaption,
  youtubeTitle,
  youtubeDescription,
  media,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [downloadAllPending, setDownloadAllPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const imageMedia = media.filter((item) => item.kind === "image");
  const hasAiContent = Boolean(instagramCaption || youtubeTitle || youtubeDescription);

  async function handleCopy(value: string, label: string) {
    if (!value) return;
    await copyText(value);
    setToast(`${label} copied to clipboard`);
    window.setTimeout(() => setToast(null), 1800);
  }

  function handleGenerate() {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      await generateProductAiContent(formData);
      router.refresh();
    });
  }

  async function handleDownloadAll() {
    if (!imageMedia.length || downloadAllPending) return;
    setDownloadAllPending(true);
    try {
      for (const item of imageMedia) {
        const anchor = document.createElement("a");
        anchor.href = `/api/admin/media/download?url=${encodeURIComponent(item.url)}`;
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        await new Promise((resolve) => setTimeout(resolve, 450));
      }
    } finally {
      setDownloadAllPending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section className="admin-card">
        {toast ? <div className="copy-toast">{toast}</div> : null}
        <div className="chart-card-head">
          <h3>AI Social Copy</h3>
          <span>{hasAiContent ? "Saved for this product" : "Generate on demand"}</span>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            type="button"
            className="primary-button"
            style={{ width: "fit-content" }}
            onClick={handleGenerate}
            disabled={pending}
          >
            {pending ? "Generating..." : hasAiContent ? "Regenerate AI Copy" : "Generate AI Copy"}
          </button>
        </div>

        <div className="admin-form" style={{ maxWidth: "none" }}>
          <label>
            Instagram Caption
            <textarea value={instagramCaption ?? ""} readOnly rows={6} />
          </label>
          <button
            type="button"
            className="secondary-button"
            style={{ width: "fit-content" }}
            onClick={() => void handleCopy(instagramCaption ?? "", "Instagram caption")}
          >
            Copy Instagram Caption
          </button>

          <label>
            YouTube Title
            <input value={youtubeTitle ?? ""} readOnly />
          </label>
          <button
            type="button"
            className="secondary-button"
            style={{ width: "fit-content" }}
            onClick={() => void handleCopy(youtubeTitle ?? "", "YouTube title")}
          >
            Copy YouTube Title
          </button>

          <label>
            YouTube Description
            <textarea value={youtubeDescription ?? ""} readOnly rows={8} />
          </label>
          <button
            type="button"
            className="secondary-button"
            style={{ width: "fit-content" }}
            onClick={() => void handleCopy(youtubeDescription ?? "", "YouTube description")}
          >
            Copy YouTube Description
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="chart-card-head">
          <h3>Image Downloads</h3>
          <span>{imageMedia.length} images</span>
        </div>

        {imageMedia.length ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button
              type="button"
              className="primary-button"
              style={{ width: "fit-content" }}
              onClick={() => void handleDownloadAll()}
              disabled={downloadAllPending}
            >
              {downloadAllPending ? "Downloading..." : "Download All Images"}
            </button>
          </div>
        ) : null}

        {imageMedia.length ? (
          <div style={{ display: "grid", gap: 12 }}>
            {imageMedia.map((item, index) => (
              <article
                key={`${item.url}-${index}`}
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: "72px minmax(0, 1fr)",
                  alignItems: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.alt ?? ""}
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--line-soft)",
                  }}
                />
                <div style={{ display: "grid", gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                    Image {index + 1}
                  </span>
                  <a
                    className="secondary-button"
                    style={{ width: "fit-content" }}
                    href={`/api/admin/media/download?url=${encodeURIComponent(item.url)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Image
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="chart-empty">No uploaded images yet.</p>
        )}
      </section>
    </div>
  );
}
