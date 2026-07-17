export type VideoProvider = "youtube" | "instagram" | "facebook";

export type MediaItem = {
  url: string;
  kind: "image" | "video";
  alt?: string | null;
};

export function detectProvider(url: string): VideoProvider | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
      return "youtube";
    }
    if (host === "instagram.com" || host === "instagr.am") return "instagram";
    if (host === "facebook.com" || host === "fb.watch" || host === "m.facebook.com") return "facebook";
    return null;
  } catch {
    return null;
  }
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
    const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
    return m ? m[2] : null;
  } catch {
    return null;
  }
}

/** Embeddable iframe src for a supported video URL, or null. */
export function embedUrl(url: string): string | null {
  const provider = detectProvider(url);
  if (provider === "youtube") {
    const id = youtubeId(url);
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (provider === "instagram") {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/^\/(reel|reels|p|tv)\/([\w-]+)/);
      return m ? `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed` : null;
    } catch {
      return null;
    }
  }
  if (provider === "facebook") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  }
  return null;
}

/** Thumbnail for a video URL. YouTube has real thumbs; others get null (render a play tile). */
export function videoThumbnail(url: string): string | null {
  if (detectProvider(url) === "youtube") {
    const id = youtubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  }
  return null;
}
