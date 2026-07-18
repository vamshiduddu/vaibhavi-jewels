"use client";

import { useRef, useState } from "react";

type Props = {
  name: string;
  initialUrl?: string | null;
  label?: string;
  helpText?: string;
  uploadContext?: {
    folder?: string;
    entityType?: string;
    entityId?: string | null;
    entityLabel?: string | null;
  };
};

export default function ImageUploadField({
  name,
  initialUrl = null,
  label = "Banner Image",
  helpText = "Upload a banner image or paste an image URL.",
  uploadContext,
}: Props) {
  const [value, setValue] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      if (uploadContext?.folder) body.append("folder", uploadContext.folder);
      if (uploadContext?.entityType) body.append("entityType", uploadContext.entityType);
      if (uploadContext?.entityId) body.append("entityId", uploadContext.entityId);
      if (uploadContext?.entityLabel) body.append("entityLabel", uploadContext.entityLabel);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = (await response.json()) as { ok?: boolean; url?: string; error?: string };
      if (!response.ok || !data.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      setValue(data.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addManualUrl() {
    const nextUrl = manualUrl.trim();
    if (!nextUrl) return;
    setError(null);
    setValue(nextUrl);
    setManualUrl("");
  }

  return (
    <div className="media-field">
      <input type="hidden" name={name} value={value} />
      <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600 }}>
        {label}
        <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 500 }}>{helpText}</span>
      </label>

      {value ? (
        <div className="media-list" style={{ gridTemplateColumns: "minmax(180px, 260px)" }}>
          <div className="media-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" />
            <span className="media-kind featured">banner</span>
            <div className="media-item-actions">
              <button type="button" className="danger" onClick={() => setValue("")}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          No banner image selected yet.
        </p>
      )}

      <div className="media-controls">
        <label className="secondary-button media-upload-btn">
          {uploading ? "Uploading..." : "Upload Banner"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={(event) => uploadFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="media-controls">
        <input
          type="url"
          placeholder="Paste image URL"
          value={manualUrl}
          onChange={(event) => setManualUrl(event.target.value)}
        />
        <button type="button" className="secondary-button" onClick={addManualUrl}>
          Use URL
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
