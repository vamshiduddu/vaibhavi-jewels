"use client";

import { useRef, useState } from "react";
import { detectProvider, videoThumbnail, type MediaItem } from "@/lib/media";

type Props = {
  initial: MediaItem[];
  uploadContext?: {
    folder?: string;
    entityType?: string;
    entityId?: string | null;
    entityLabel?: string | null;
  };
};

export default function MediaField({ initial, uploadContext }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        if (uploadContext?.folder) body.append("folder", uploadContext.folder);
        if (uploadContext?.entityType) body.append("entityType", uploadContext.entityType);
        if (uploadContext?.entityId) body.append("entityId", uploadContext.entityId);
        if (uploadContext?.entityLabel) body.append("entityLabel", uploadContext.entityLabel);
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (data.ok) {
          setItems((prev) => [...prev, { url: data.url, kind: "image" }]);
        } else {
          setError(data.error ?? "Upload failed.");
          break;
        }
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addVideo() {
    const url = videoUrl.trim();
    if (!url) return;
    if (!detectProvider(url)) {
      setError("Video link must be from YouTube, Instagram, or Facebook.");
      return;
    }
    setError(null);
    setItems((prev) => [...prev, { url, kind: "video" }]);
    setVideoUrl("");
  }

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!url) return;
    setError(null);
    setItems((prev) => [...prev, { url, kind: "image" }]);
    setImageUrl("");
  }

  return (
    <div className="media-field">
      <input type="hidden" name="media" value={JSON.stringify(items)} />

      {items.length ? (
        <div className="media-list">
          {items.map((item, i) => {
            const thumb = item.kind === "video" ? videoThumbnail(item.url) : item.url;
            return (
              <div key={`${item.url}-${i}`} className="media-item">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" />
                ) : (
                  <span className="media-item-tile">▶</span>
                )}
                {item.kind === "video" ? <span className="media-kind">▶ video</span> : null}
                {i === 0 && item.kind === "image" ? (
                  <span className="media-kind featured">featured</span>
                ) : null}
                <div className="media-item-actions">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move later"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          No media yet. Upload images or add a video link — the first image becomes the cover.
        </p>
      )}

      <div className="media-controls">
        <label className="secondary-button media-upload-btn">
          {uploading ? "Uploading..." : "Upload Images"}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            disabled={uploading}
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </label>
      </div>
      <div className="media-controls">
        <input
          type="url"
          placeholder="Paste image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button type="button" className="secondary-button" onClick={addImageUrl}>
          Add Image URL
        </button>
      </div>
      <div className="media-controls">
        <input
          type="url"
          placeholder="Paste YouTube / Instagram / Facebook video link"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button type="button" className="secondary-button" onClick={addVideo}>
          Add Video
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
