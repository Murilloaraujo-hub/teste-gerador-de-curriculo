/**
 * Video2MP3 - Frontend Application Logic
 * Architecture: Frontend (GitHub Pages) <-> Backend API REST (Render / Flask / FFmpeg)
 */

// Global API configuration
let API_URL = localStorage.getItem("VIDEO2MP3_API_URL") || window.location.origin;

// DOM Elements
const videoUrlInput = document.getElementById("video-url");
const verifyBtn = document.getElementById("verify-btn");
const verifySpinner = document.getElementById("verify-spinner");
const errorBox = document.getElementById("error-box");
const errorMessage = document.getElementById("error-message");

const videoInfoCard = document.getElementById("video-info-card");
const videoThumbnail = document.getElementById("video-thumbnail");
const videoTitle = document.getElementById("video-title");
const videoChannel = document.getElementById("video-channel");
const videoDuration = document.getElementById("video-duration");
const audioQualitySelect = document.getElementById("audio-quality");
const convertBtn = document.getElementById("convert-btn");

const progressBox = document.getElementById("progress-box");
const statusStepText = document.getElementById("status-step-text");
const progressBarFill = document.getElementById("progress-bar-fill");

const resultBox = document.getElementById("result-box");
const resultFilename = document.getElementById("result-filename");
const downloadLink = document.getElementById("download-link");
const resetBtn = document.getElementById("reset-btn");

// Config Modal Elements
const openConfigBtn = document.getElementById("open-config-btn");
const closeConfigBtn = document.getElementById("close-config-btn");
const configModal = document.getElementById("config-modal");
const apiUrlInput = document.getElementById("api-url-input");
const saveConfigBtn = document.getElementById("save-config-btn");

// State
let currentVideoInfo = null;
let currentObjectUrl = null;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    if (apiUrlInput) {
        apiUrlInput.value = API_URL;
    }
});

function initEvents() {
    verifyBtn.addEventListener("click", handleVerifyUrl);
    videoUrlInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleVerifyUrl();
    });

    convertBtn.addEventListener("click", handleStartConversion);
    resetBtn.addEventListener("click", resetForm);

    // Modal Config
    if (openConfigBtn) openConfigBtn.addEventListener("click", () => configModal.style.display = "flex");
    if (closeConfigBtn) closeConfigBtn.addEventListener("click", () => configModal.style.display = "none");
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener("click", () => {
            let val = apiUrlInput.value.trim();
            if (val.endsWith("/")) val = val.slice(0, -1);
            if (val) {
                API_URL = val;
                localStorage.setItem("VIDEO2MP3_API_URL", API_URL);
            } else {
                API_URL = window.location.origin;
                localStorage.removeItem("VIDEO2MP3_API_URL");
            }
            configModal.style.display = "none";
            alert("URL da API atualizada para: " + API_URL);
        });
    }
}

/**
 * Validates YouTube URL strictly
 */
function isValidYouTubeUrl(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return false;
    
    let trimmed = urlStr.trim();
    if (!trimmed.startsWith("https://")) return false;

    if (
        trimmed.includes("localhost") || 
        trimmed.includes("127.0.0.1") || 
        trimmed.includes("0.0.0.0") ||
        trimmed.includes("192.168.") ||
        trimmed.includes("10.") ||
        trimmed.includes("172.16.")
    ) {
        return false;
    }

    try {
        const urlObj = new URL(trimmed);
        const host = urlObj.hostname.toLowerCase();
        
        const isYTDomain = 
            host === "youtube.com" || 
            host === "www.youtube.com" || 
            host === "m.youtube.com" || 
            host === "youtu.be" ||
            host.endsWith(".youtube.com");

        if (!isYTDomain) return false;

        if (host === "youtu.be") {
            return urlObj.pathname.length > 1;
        }

        if (urlObj.pathname.startsWith("/watch") && urlObj.searchParams.has("v")) {
            return true;
        }

        if (urlObj.pathname.startsWith("/shorts/")) {
            return true;
        }

        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Extract YouTube Video ID from URL
 */
function extractVideoId(urlStr) {
    try {
        const urlObj = new URL(urlStr.trim());
        if (urlObj.hostname === "youtu.be") {
            return urlObj.pathname.substring(1).split("?")[0];
        }
        if (urlObj.pathname.startsWith("/shorts/")) {
            return urlObj.pathname.split("/")[2];
        }
        return urlObj.searchParams.get("v");
    } catch (e) {
        return null;
    }
}

/**
 * Safe JSON response parser
 * Verifies response status and Content-Type header before calling .json()
 */
async function parseJsonResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }
    }

    if (!response.ok) {
        const customError = data && data.error 
            ? data.error 
            : "Não foi possível processar este vídeo. Verifique a URL e tente novamente.";
        throw new Error(customError);
    }

    return data;
}

/**
 * Handle URL Verification Step
 */
async function handleVerifyUrl() {
    hideError();
    hideResult();
    hideProgress();

    const rawUrl = videoUrlInput.value.trim();

    if (!rawUrl) {
        showError("Por favor, cole um link de vídeo do YouTube.");
        return;
    }

    if (!isValidYouTubeUrl(rawUrl)) {
        showError("URL do YouTube inválida ou não suportada. Certifique-se de que é um link público com HTTPS.");
        return;
    }

    const videoId = extractVideoId(rawUrl);
    if (!videoId) {
        showError("Não foi possível identificar o código do vídeo do YouTube.");
        return;
    }

    setVerifyLoading(true);

    try {
        let infoData = null;
        try {
            const endpoint = `${API_URL}/api/info?url=${encodeURIComponent(rawUrl)}`;
            const res = await fetch(endpoint, {
                headers: { "Accept": "application/json" }
            });
            infoData = await parseJsonResponse(res);
        } catch (err) {
            console.log("Aviso ao conectar com a API de metadados, tentando fallback oEmbed...", err);
        }

        if (!infoData) {
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const oembedRes = await fetch(oembedUrl);
            if (oembedRes.ok) {
                const json = await oembedRes.json();
                infoData = {
                    title: json.title || "Vídeo do YouTube",
                    channel: json.author_name || "Canal do YouTube",
                    duration: "Duração variável",
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    url: rawUrl
                };
            } else {
                infoData = {
                    title: `Vídeo YouTube (${videoId})`,
                    channel: "YouTube",
                    duration: "Não informada",
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                    url: rawUrl
                };
            }
        }

        currentVideoInfo = infoData;

        videoTitle.textContent = infoData.title || "🎬 Vídeo do YouTube";
        videoChannel.textContent = infoData.channel || "YouTube";
        videoDuration.textContent = infoData.duration || "00:00";
        videoThumbnail.src = infoData.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        videoInfoCard.style.display = "block";
    } catch (err) {
        showError(err.message || "Não foi possível obter informações deste vídeo. Verifique a URL e tente novamente.");
    } fontally {
        setVerifyLoading(false);
    }
}

/**
 * Handle Start Conversion Step
 */
async function handleStartConversion() {
    if (!currentVideoInfo && !videoUrlInput.value.trim()) {
        showError("Insira uma URL válida primeiro.");
        return;
    }

    const targetUrl = currentVideoInfo ? currentVideoInfo.url : videoUrlInput.value.trim();
    const quality = parseInt(audioQualitySelect.value, 10) || 192;

    hideError();
    videoInfoCard.style.display = "none";
    progressBox.style.display = "block";

    const steps = [
        "1. Verificando URL...",
        "2. Obtendo informações...",
        "3. Preparando arquivo...",
        "4. Convertendo áudio...",
        "5. Finalizando MP3..."
    ];

    let currentStep = 0;
    statusStepText.textContent = steps[0];
    progressBarFill.classList.add("indeterminate");

    const stepInterval = setInterval(() => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            statusStepText.textContent = steps[currentStep];
        }
    }, 1200);

    try {
        const convertEndpoint = `${API_URL}/api/convert`;
        const response = await fetch(convertEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "audio/mpeg, application/json"
            },
            body: JSON.stringify({
                url: targetUrl,
                quality: quality
            })
        });

        clearInterval(stepInterval);

        if (!response.ok) {
            const contentType = response.headers.get("content-type") || "";
            let errorMessageText = "Não foi possível processar este vídeo. Verifique a URL e tente novamente.";
            
            if (contentType.includes("application/json")) {
                try {
                    const errJson = await response.json();
                    if (errJson && errJson.error) {
                        errorMessageText = errJson.error;
                    }
                } catch (e) {}
            }
            throw new Error(errorMessageText);
        }

        const blob = await response.blob();
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
        }
        currentObjectUrl = URL.createObjectURL(blob);

        let filename = "video.mp3";
        const contentDisposition = response.headers.get("Content-Disposition");
        if (contentDisposition && contentDisposition.includes("filename=")) {
            const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/);
            if (match && match[1]) filename = match[1];
        } else if (currentVideoInfo && currentVideoInfo.title) {
            const cleanTitle = currentVideoInfo.title
                .toLowerCase()
                .replace(/[^a-z0-0a-zA-Z0-9\s-]/g, "")
                .trim()
                .replace(/\s+/g, "-");
            filename = `${cleanTitle || "audio"}.mp3`;
        }

        statusStepText.textContent = "6. Conversão concluída!";
        progressBarFill.classList.remove("indeterminate");
        progressBarFill.style.width = "100%";

        setTimeout(() => {
            progressBox.style.display = "none";
            showResult(filename, currentObjectUrl);
        }, 600);

    } catch (err) {
        clearInterval(stepInterval);
        progressBox.style.display = "none";
        videoInfoCard.style.display = "block";
        showError(err.message || "Não foi possível processar este vídeo. Verifique se o conteúdo é autorizado e tente novamente.");
    }
}

/**
 * UI Display Helpers
 */
function setVerifyLoading(isLoading) {
    if (isLoading) {
        verifyBtn.disabled = true;
        verifySpinner.style.display = "inline-block";
    } else {
        verifyBtn.disabled = false;
        verifySpinner.style.display = "none";
    }
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorBox.style.display = "flex";
}

function hideError() {
    errorBox.style.display = "none";
}

function hideProgress() {
    progressBox.style.display = "none";
    progressBarFill.style.width = "0%";
}

function hideResult() {
    resultBox.style.display = "none";
}

function showResult(filename, blobUrl) {
    resultFilename.textContent = filename;
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    resultBox.style.display = "block";
}

function resetForm() {
    hideError();
    hideResult();
    hideProgress();
    videoInfoCard.style.display = "none";
    videoUrlInput.value = "";
    currentVideoInfo = null;
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
}
