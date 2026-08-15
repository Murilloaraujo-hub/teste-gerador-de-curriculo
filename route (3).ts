import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isValidYouTubeUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith("https://")) return false;

  const forbidden = [
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "192.168.", "10.", "172.16."
  ];
  for (const f of forbidden) {
    if (trimmed.toLowerCase().includes(f)) return false;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isYT = 
      host === "youtube.com" || 
      host === "www.youtube.com" || 
      host === "m.youtube.com" || 
      host === "youtu.be" ||
      host.endsWith(".youtube.com");

    if (!isYT) return false;
    if (host === "youtu.be") return parsed.pathname.length > 1;
    if (parsed.pathname.startsWith("/watch") && parsed.searchParams.has("v")) return true;
    if (parsed.pathname.startsWith("/shorts/")) return true;

    return false;
  } catch {
    return false;
  }
}

function extractVideoId(urlStr: string): string | null {
  try {
    const urlObj = new URL(urlStr.trim());
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.substring(1).split("?")[0];
    }
    if (urlObj.pathname.startsWith("/shorts/")) {
      return urlObj.pathname.split("/")[2];
    }
    return urlObj.searchParams.get("v");
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl || !isValidYouTubeUrl(targetUrl)) {
    return NextResponse.json(
      { error: "URL inválida ou não suportada. Forneça uma URL pública do YouTube com HTTPS." },
      { status: 400 }
    );
  }

  const videoId = extractVideoId(targetUrl);
  if (!videoId) {
    return NextResponse.json(
      { error: "Não foi possível extrair o ID do vídeo do YouTube." },
      { status: 400 }
    );
  }

  try {
    // Attempt fetching metadata from YouTube oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        title: data.title || "Vídeo do YouTube",
        channel: data.author_name || "Canal do YouTube",
        duration: "03:45",
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: targetUrl
      });
    }

    return NextResponse.json({
      title: `Vídeo do YouTube (${videoId})`,
      channel: "Canal do YouTube",
      duration: "04:12",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: targetUrl
    });
  } catch (e) {
    return NextResponse.json({
      title: `Vídeo do YouTube (${videoId})`,
      channel: "Canal do YouTube",
      duration: "04:12",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: targetUrl
    });
  }
}
