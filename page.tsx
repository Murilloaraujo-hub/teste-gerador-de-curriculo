"use client";

import React, { useState, useEffect } from "react";
import {
  Music,
  Download,
  ShieldCheck,
  FileCode,
  Settings,
  AlertTriangle,
  RefreshCw,
  Server,
  Globe,
  Clock,
  CheckCircle2,
  Code2,
  Terminal,
  ChevronDown
} from "lucide-react";

interface VideoInfo {
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  url: string;
}

interface ConversionLog {
  id: number;
  videoTitle: string;
  channelName: string | null;
  duration: string | null;
  quality: number;
  createdAt: string;
}

export default function HomePage() {
  const [urlInput, setUrlInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<number>(192);

  const [isConverting, setIsConverting] = useState(false);
  const [statusStep, setStatusStep] = useState("1. Verificando URL...");
  const [isDone, setIsDone] = useState(false);

  const [downloadFilename, setDownloadFilename] = useState("");
  const [downloadBlobUrl, setDownloadBlobUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<ConversionLog[]>([]);
  const [activeTab, setActiveTab] = useState<"converter" | "code" | "architecture" | "privacy">("converter");
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>("frontend/index.html");

  const [backendUrl, setBackendUrl] = useState<string>("");
  const [showConfigModal, setShowConfigModal] = useState(false);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/conversions");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.conversions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const validateYouTubeUrl = (url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith("https://")) return false;

    const forbidden = ["localhost", "127.0.0.1", "0.0.0.0", "192.168.", "10.", "172.16."];
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
  };

  /**
   * Safely parses JSON response checking content-type and response status
   */
  const parseJsonResponse = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    let data: any = null;

    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const msg = data && data.error 
        ? data.error 
        : "Não foi possível processar este vídeo. Verifique a URL e tente novamente.";
      throw new Error(msg);
    }

    return data;
  };

  const handleVerify = async () => {
    setErrorMessage(null);
    setIsDone(false);

    if (!urlInput.trim()) {
      setErrorMessage("Por favor, cole um link de vídeo do YouTube.");
      return;
    }

    if (!validateYouTubeUrl(urlInput)) {
      setErrorMessage("URL do YouTube inválida ou não suportada. Certifique-se de que é um link público com HTTPS.");
      return;
    }

    setIsVerifying(true);
    setVideoInfo(null);

    try {
      const apiEndpoint = backendUrl ? `${backendUrl}/api/info?url=${encodeURIComponent(urlInput.trim())}` : `/api/info?url=${encodeURIComponent(urlInput.trim())}`;
      const res = await fetch(apiEndpoint, {
        headers: { Accept: "application/json" }
      });

      const data = await parseJsonResponse(res);
      setVideoInfo(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Não foi possível verificar a URL do vídeo.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConvert = async () => {
    if (!urlInput.trim() && !videoInfo) return;

    setErrorMessage(null);
    setIsConverting(true);
    setIsDone(false);

    const targetUrl = videoInfo ? videoInfo.url : urlInput.trim();

    const steps = [
      "1. Verificando URL...",
      "2. Obtendo informações...",
      "3. Preparando arquivo...",
      "4. Convertendo áudio...",
      "5. Finalizando MP3..."
    ];

    let currentStepIdx = 0;
    setStatusStep(steps[0]);

    const interval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setStatusStep(steps[currentStepIdx]);
      }
    }, 1200);

    try {
      const endpoint = backendUrl ? `${backendUrl}/api/convert` : `/api/convert`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "audio/mpeg, application/json" 
        },
        body: JSON.stringify({
          url: targetUrl,
          quality: selectedQuality
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let msg = "Não foi possível processar este vídeo. Verifique a URL e tente novamente.";
        if (contentType.includes("application/json")) {
          try {
            const errJson = await response.json();
            if (errJson?.error) msg = errJson.error;
          } catch {}
        }
        throw new Error(msg);
      }

      const blob = await response.blob();
      if (downloadBlobUrl) {
        URL.revokeObjectURL(downloadBlobUrl);
      }
      const newBlobUrl = URL.createObjectURL(blob);

      let filename = "video.mp3";
      const contentDisp = response.headers.get("Content-Disposition");
      if (contentDisp && contentDisp.includes("filename=")) {
        const match = contentDisp.match(/filename=["']?([^"';]+)["']?/);
        if (match && match[1]) filename = match[1];
      } else if (videoInfo?.title) {
        const clean = videoInfo.title
          .toLowerCase()
          .replace(/[^a-z0-0a-zA-Z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        filename = `${clean || "audio"}.mp3`;
      }

      setDownloadFilename(filename);
      setDownloadBlobUrl(newBlobUrl);
      setStatusStep("6. Conversão concluída!");

      setTimeout(() => {
        setIsConverting(false);
        setIsDone(true);
        loadHistory();
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setIsConverting(false);
      setErrorMessage(err.message || "Não foi possível processar este vídeo. Verifique a URL e tente novamente.");
    }
  };

  const handleReset = () => {
    setUrlInput("");
    setVideoInfo(null);
    setErrorMessage(null);
    setIsConverting(false);
    setIsDone(false);
    if (downloadBlobUrl) {
      URL.revokeObjectURL(downloadBlobUrl);
      setDownloadBlobUrl(null);
    }
  };

  const codeFiles: Record<string, { label: string; code: string; lang: string }> = {
    "frontend/index.html": {
      label: "frontend/index.html",
      lang: "html",
      code: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video2MP3 — Conversor de Vídeos para MP3</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="navbar">
        <div class="container navbar-container">
            <a href="#" class="brand">🎵 Video2MP3</a>
            <nav class="nav-menu">
                <a href="#inicio" class="nav-link active">Início</a>
                <a href="#como-funciona" class="nav-link">Como funciona</a>
                <a href="#privacidade" class="nav-link">Privacidade</a>
            </nav>
        </div>
    </header>
    <main class="main-content">
        <section class="converter-section container">
            <input type="url" id="video-url" class="url-input" placeholder="https://www.youtube.com/watch?v=...">
            <button id="verify-btn" class="btn btn-primary">Verificar vídeo</button>
        </section>
    </main>
    <script src="script.js"></script>
</body>
</html>`
    },
    "frontend/script.js": {
      label: "frontend/script.js",
      lang: "javascript",
      code: `let API_URL = localStorage.getItem("VIDEO2MP3_API_URL") || "https://seu-backend.onrender.com";

async function parseJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    let data = null;
    if (contentType.includes("application/json")) {
        try { data = await response.json(); } catch (e) {}
    }
    if (!response.ok) {
        throw new Error(data && data.error ? data.error : "Erro na requisição ao servidor.");
    }
    return data;
}

async function verifyVideo(url) {
    const res = await fetch(\`\${API_URL}/api/info?url=\${encodeURIComponent(url)}\`);
    return await parseJsonResponse(res);
}`
    },
    "backend/app.py": {
      label: "backend/app.py",
      lang: "python",
      code: `import os, tempfile, subprocess
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def json_error(message, code=400):
    response = jsonify({"error": message})
    response.status_code = code
    response.headers["Content-Type"] = "application/json"
    return response

@app.errorhandler(404)
def not_found_error(error):
    return json_error("Rota não encontrada na API.", 404)

@app.errorhandler(500)
def internal_error(error):
    return json_error("Erro interno no servidor.", 500)

@app.route('/api/info', methods=['GET'])
def info():
    video_url = request.args.get('url', '').strip()
    if not video_url:
        return json_error("URL não informada.", 400)
    return jsonify({"title": "Vídeo", "channel": "Canal", "url": video_url})`
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                Video2MP3
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Fullstack
                </span>
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("converter")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "converter"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Início
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "code"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Código Fonte
            </button>
            <button
              onClick={() => setActiveTab("architecture")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors hidden sm:flex items-center gap-1.5 ${
                activeTab === "architecture"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              Arquitetura
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === "privacy"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              Privacidade
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-1"
              title="Configurar Backend URL"
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {activeTab === "converter" && (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Conteúdo Autorizado &amp; Conversão FFmpeg
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Converta vídeos autorizados para MP3
              </h1>
              <p className="text-slate-400 text-base max-w-xl mx-auto">
                Transforme vídeos autorizados em MP3. Processamento rápido e simples através do nosso servidor.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-slate-950/50 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span>🔗</span> Cole o link do vídeo
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm outline-none transition-all"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={isVerifying || isConverting}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      "Verificar vídeo"
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Exemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-300 text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {videoInfo && !isConverting && !isDone && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-3">
                      <h2 className="text-base font-bold text-white leading-snug">
                        🎬 {videoInfo.title}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                        <span><strong>Canal:</strong> {videoInfo.channel}</span>
                        <span><strong>Duração:</strong> {videoInfo.duration}</span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-semibold text-slate-300 block">
                          Qualidade do MP3:
                        </label>
                        <div className="relative">
                          <select
                            value={selectedQuality}
                            onChange={(e) => setSelectedQuality(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500 appearance-none pr-8 cursor-pointer"
                          >
                            <option value={128}>128 kbps (Econômico)</option>
                            <option value={192}>192 kbps (Padrão Recomendado)</option>
                            <option value={256}>256 kbps (Alta Qualidade)</option>
                            <option value={320}>320 kbps (Máxima Fidelidade)</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <button
                        onClick={handleConvert}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
                      >
                        <Music className="w-4 h-4" />
                        Converter para MP3
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {isConverting && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-blue-400 animate-spin" />
                    <div>
                      <h3 className="font-bold text-white text-base">⏳ Processando seu vídeo...</h3>
                      <p className="text-xs text-slate-400">
                        Isso pode levar alguns minutos dependendo da duração do conteúdo e da carga do servidor.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-blue-400">
                      <span>{statusStep}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse w-full"></div>
                    </div>
                  </div>
                </div>
              )}

              {isDone && downloadBlobUrl && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 space-y-5 animate-in fade-in duration-300">
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5" />
                    ✓ Conversão concluída!
                  </div>

                  <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Music className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-white text-sm truncate">{downloadFilename}</h4>
                      <p className="text-xs text-slate-400">Formato: MP3 (audio/mpeg) • Taxa: {selectedQuality} kbps</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={downloadBlobUrl}
                      download={downloadFilename}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl text-center text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      ⬇ Baixar MP3
                    </a>
                    <button
                      onClick={handleReset}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 px-6 rounded-xl text-sm transition-all"
                    >
                      Converter outro vídeo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm">1</div>
                <h3 className="font-bold text-white text-sm">Cole o Link</h3>
                <p className="text-xs text-slate-400">Insira a URL do vídeo do YouTube que você tem autorização.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm">2</div>
                <h3 className="font-bold text-white text-sm">Escolha a Qualidade</h3>
                <p className="text-xs text-slate-400">Disponível em 128, 192 (padrão), 256 e 320 kbps.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm">3</div>
                <h3 className="font-bold text-white text-sm">FFmpeg Backend</h3>
                <p className="text-xs text-slate-400">O servidor Python codifica o áudio em MP3 real e compatível.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-sm">4</div>
                <h3 className="font-bold text-white text-sm">Baixe o MP3</h3>
                <p className="text-xs text-slate-400">Receba o arquivo direto para caixas de som, celular e carros.</p>
              </div>
            </div>

            {history.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Histórico Recente de Conversões
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Título</th>
                        <th className="p-3">Canal</th>
                        <th className="p-3">Qualidade</th>
                        <th className="p-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30">
                          <td className="p-3 font-medium text-slate-100 max-w-xs truncate">{item.videoTitle}</td>
                          <td className="p-3 text-slate-400">{item.channelName || "YouTube"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {item.quality} kbps
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "code" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Code2 className="w-6 h-6 text-blue-400" />
                Arquivos do Projeto Standalone (Video2MP3)
              </h2>
              <p className="text-sm text-slate-400">
                Abaixo estão os arquivos com tratamentos seguros de retornos não-JSON e manipuladores globais no Flask.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Frontend</div>
                {["frontend/index.html", "frontend/script.js"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedCodeFile(f)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                      selectedCodeFile === f
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    📄 {f.replace("frontend/", "")}
                  </button>
                ))}

                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 pt-4">Backend</div>
                {["backend/app.py"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedCodeFile(f)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                      selectedCodeFile === f
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    🐍 {f.replace("backend/", "")}
                  </button>
                ))}
              </div>

              <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-300 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    {selectedCodeFile}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeFiles[selectedCodeFile]?.code || "");
                      alert("Código copiado!");
                    }}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded transition-colors"
                  >
                    Copiar Código
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed">
                  {codeFiles[selectedCodeFile]?.code}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "architecture" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Server className="w-6 h-6 text-blue-400" />
                Arquitetura e Tratamento Seguro
              </h2>
              <p className="text-sm text-slate-400">
                Garantia de que a API sempre responde com `Content-Type: application/json` e que o cliente valida a resposta antes de invocar `.json()`.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
              <h3 className="font-bold text-white text-base">Fluxo de Dados com Tratamento Seguro</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center text-xs">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="font-bold text-blue-400">Usuário</div>
                  <div className="text-slate-500">Cliques no botão</div>
                </div>
                <div className="flex items-center justify-center text-slate-600 font-bold">➔</div>
                <div className="bg-slate-950 border border-blue-500/30 p-4 rounded-xl space-y-1">
                  <div className="font-bold text-emerald-400">Fetch API</div>
                  <div className="text-slate-400">Verifica res.ok &amp; Content-Type</div>
                </div>
                <div className="flex items-center justify-center text-slate-600 font-bold">➔</div>
                <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-xl space-y-1">
                  <div className="font-bold text-indigo-400">Flask Backend</div>
                  <div className="text-slate-400">Errorhandlers com JSON</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Política de Privacidade e Termos de Uso</h2>
                <p className="text-xs text-slate-400">Video2MP3 — Processamento de Conteúdo Autorizado</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              O <strong>Video2MP3</strong> não mantém seus arquivos permanentemente. O conteúdo utilizado durante o processamento é armazenado apenas temporariamente no servidor backend e removido imediatamente após a conclusão da conversão.
            </p>

            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded-r-xl text-xs text-slate-300 space-y-2">
              <p className="font-bold text-blue-300 text-sm">⚠️ Compromisso com Conteúdo Autorizado:</p>
              <p>
                O sistema deve ser utilizado somente para vídeos que o usuário tenha autorização prévia para baixar ou converter. O projeto não possui nem implementa mecanismos para contornar DRM, autenticação, paywalls, vídeos privados ou restrições técnicas de plataformas.
              </p>
            </div>
          </div>
        )}
      </main>

      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Configurar API Backend
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Insira a URL do backend hospedado no Render para testar a comunicação direta:
              </p>
              <input
                type="url"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="https://seu-backend.onrender.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setBackendUrl("");
                  setShowConfigModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Restaurar Padrão
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 bg-slate-900/50 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p>Video2MP3 — Projeto desenvolvido para conversão de conteúdo autorizado.</p>
          <p className="text-[11px] text-slate-600">Frontend: GitHub Pages | Backend: Render + Flask + FFmpeg</p>
        </div>
      </footer>
    </div>
  );
}
