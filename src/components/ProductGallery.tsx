"use client";

import { useCallback, useEffect, useState } from "react";
import { embedUrl, videoThumbnail, type MediaItem } from "@/lib/media";

export default function ProductGallery({ media, title }: { media: MediaItem[]; title: string }) {
  const items = media.length ? media : [{ url: "/vaibhavi-logo.png", kind: "image" as const }];
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const current = items[Math.min(index, items.length - 1)];

  const prev = useCallback(
    () => {
      setZoomed(false);
      setIndex((i) => (i - 1 + items.length) % items.length);
    },
    [items.length],
  );
  const next = useCallback(() => {
    setZoomed(false);
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, prev, next]);

  const currentEmbed = current.kind === "video" ? embedUrl(current.url) : null;

  return (
    <div className="product-gallery">
      <div className="gallery-main">
        {current.kind === "video" && currentEmbed ? (
          <iframe
            key={current.url}
            src={currentEmbed}
            title={`${title} video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.alt ?? title} />
            <button
              type="button"
              className="gallery-zoom"
              onClick={() => {
                setZoomed(false);
                setLightbox(true);
              }}
              aria-label="Zoom image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.8-3.8" />
                <path d="M8.5 11h5M11 8.5v5" />
              </svg>
            </button>
          </>
        )}
        {items.length > 1 ? (
          <>
            <button type="button" className="gallery-arrow left" onClick={prev} aria-label="Previous">
              ‹
            </button>
            <button type="button" className="gallery-arrow right" onClick={next} aria-label="Next">
              ›
            </button>
          </>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="gallery-thumbs">
          {items.map((item, i) => {
            const thumb = item.kind === "video" ? videoThumbnail(item.url) : item.url;
            return (
              <button
                type="button"
                key={`${item.url}-${i}`}
                className={i === index ? "active" : undefined}
                onClick={() => {
                  setZoomed(false);
                  setIndex(i);
                }}
                aria-label={item.kind === "video" ? `Video ${i + 1}` : `Image ${i + 1}`}
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt="" loading="lazy" />
                ) : (
                  <span className="thumb-tile" />
                )}
                {item.kind === "video" ? <span className="thumb-play">▶</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {lightbox && current.kind === "image" ? (
        <div
          className="lightbox"
          onClick={() => {
            setZoomed(false);
            setLightbox(false);
          }}
          role="dialog"
          aria-label="Image zoom"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => {
              setZoomed(false);
              setLightbox(false);
            }}
            aria-label="Close"
          >
            ✕
          </button>
          {items.length > 1 ? (
            <>
              <button
                type="button"
                className="gallery-arrow left"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                className="gallery-arrow right"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          ) : null}
          <div className={`lightbox-stage${zoomed ? " zoomed" : ""}`} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.alt ?? title}
              onClick={() => setZoomed((z) => !z)}
              style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
            />
          </div>
          <p className="lightbox-hint">Click the image to {zoomed ? "shrink" : "zoom"} · Esc to close</p>
        </div>
      ) : null}
    </div>
  );
}
