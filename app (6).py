import os
import re
import sys
import uuid
import logging
import tempfile
import subprocess
from urllib.parse import urlparse
from flask import Flask, request, jsonify, send_file, after_this_request, make_response
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

FRONTEND_URL = os.environ.get('FRONTEND_URL', '*')
MAX_FILE_SIZE_MB = int(os.environ.get('MAX_FILE_SIZE_MB', 500))
ALLOWED_QUALITIES = [128, 192, 256, 320]

if FRONTEND_URL and FRONTEND_URL != '*':
    CORS(app, origins=[FRONTEND_URL], supports_credentials=True)
else:
    CORS(app)

def json_error(message, code=400):
    response = jsonify({"error": message})
    response.status_code = code
    response.headers["Content-Type"] = "application/json"
    return response

@app.errorhandler(404)
def not_found_error(error):
    return json_error("Rota ou recurso não encontrado na API.", 404)

@app.errorhandler(405)
def method_not_allowed_error(error):
    return json_error("Método HTTP não permitido para esta rota.", 405)

@app.errorhandler(500)
def internal_server_error(error):
    return json_error("Erro interno do servidor ao processar a requisição.", 500)

@app.errorhandler(Exception)
def handle_unexpected_exception(error):
    logger.error(f"Exceção não tratada: {str(error)}")
    return json_error("Ocorreu um erro inesperado no servidor.", 500)

def is_valid_youtube_url(url_str):
    if not url_str or not isinstance(url_str, str):
        return False
    
    url_str = url_str.strip()
    if not url_str.startswith("https://"):
        return False

    forbidden_keywords = [
        "localhost", "127.0.0.1", "0.0.0.0", "::1",
        "192.168.", "10.", "172.16.", "172.17.", "172.18.",
        "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
        "172.24.", "172.25.", "172.26.", "172.27.", "172.28.",
        "172.29.", "172.30.", "172.31.", "internal", "local"
    ]
    
    url_lower = url_str.lower()
    for kw in forbidden_keywords:
        if kw in url_lower:
            return False

    try:
        parsed = urlparse(url_str)
        hostname = parsed.hostname.lower() if parsed.hostname else ""

        allowed_hosts = [
            "youtube.com", "www.youtube.com", "m.youtube.com", 
            "youtu.be", "music.youtube.com"
        ]

        if hostname not in allowed_hosts and not hostname.endswith(".youtube.com"):
            return False

        return True
    except Exception:
        return False

def sanitize_filename(name):
    clean = re.sub(r'[^a-zA-Z0-9_\-\s\.]', '', name)
    clean = clean.replace(' ', '-').strip()
    return clean[:100] if clean else "audio"

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "status": "ok",
        "service": "Video2MP3 API Backend",
        "version": "1.0.0"
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@app.route('/api/info', methods=['GET'])
def get_video_info():
    video_url = request.args.get('url', '').strip()

    if not is_valid_youtube_url(video_url):
        return json_error("URL inválida ou não suportada. Forneça um link público do YouTube com HTTPS.", 400)

    try:
        import yt_dlp
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            title = info.get('title', 'Vídeo sem título')
            uploader = info.get('uploader', info.get('channel', 'Canal do YouTube'))
            duration_sec = info.get('duration', 0)
            
            minutes = duration_sec // 60
            seconds = duration_sec % 60
            duration_formatted = f"{minutes:02d}:{seconds:02d}"

            thumbnail = info.get('thumbnail', f"https://i.ytimg.com/vi/{info.get('id', '')}/hqdefault.jpg")

            return jsonify({
                "title": title,
                "channel": uploader,
                "duration": duration_formatted,
                "thumbnail": thumbnail,
                "url": video_url
            }), 200

    except Exception as e:
        logger.error(f"Erro ao obter informações do vídeo: {str(e)}")
        return json_error("Não foi possível obter informações deste vídeo. Verifique se o conteúdo é público e autorizado.", 500)

@app.route('/api/convert', methods=['POST'])
def convert_video():
    data = request.get_json(silent=True) or {}
    video_url = data.get('url', '').strip()
    quality = data.get('quality', 192)

    if not is_valid_youtube_url(video_url):
        return json_error("URL inválida ou não autorizada. Por favor forneça uma URL válida do YouTube com HTTPS.", 400)

    try:
        quality = int(quality)
        if quality not in ALLOWED_QUALITIES:
            quality = 192
    except (ValueError, TypeError):
        quality = 192

    temp_dir = tempfile.mkdtemp(prefix="v2mp3_")
    
    try:
        import yt_dlp

        output_template = os.path.join(temp_dir, "%(id)s.%(ext)s")
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
            'max_filesize': MAX_FILE_SIZE_MB * 1024 * 1024,
        }

        logger.info(f"Iniciando download de áudio para: {video_url}")
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            downloaded_file = ydl.prepare_filename(info)
            raw_title = info.get('title', 'video')

        if not os.path.exists(downloaded_file):
            files = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir)]
            if not files:
                raise RuntimeError("Falha no download da fonte de áudio.")
            downloaded_file = files[0]

        clean_title = sanitize_filename(raw_title)
        output_mp3_path = os.path.join(temp_dir, f"{clean_title}.mp3")

        ffmpeg_cmd = [
            'ffmpeg',
            '-y',
            '-i', downloaded_file,
            '-vn',
            '-acodec', 'libmp3lame',
            '-b:a', f'{quality}k',
            output_mp3_path
        ]

        logger.info(f"Executando FFmpeg com bitrate {quality}k...")
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if not os.path.exists(output_mp3_path):
            raise RuntimeError("O arquivo MP3 não foi gerado pelo FFmpeg.")

        @after_this_request
        def cleanup(response):
            try:
                if os.path.exists(temp_dir):
                    import shutil
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    logger.info(f"Diretório temporário removido: {temp_dir}")
            except Exception as e:
                logger.error(f"Erro ao limpar arquivos temporários: {e}")
            return response

        return send_file(
            output_mp3_path,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name=f"{clean_title}.mp3"
        )

    except subprocess.CalledProcessError as spe:
        logger.error(f"Erro no FFmpeg: {spe.stderr.decode('utf-8', errors='ignore')}")
        self_cleanup(temp_dir)
        return json_error("Erro durante o processamento do FFmpeg. Não foi possível converter o áudio.", 500)
    except Exception as e:
        logger.error(f"Erro ao converter vídeo: {str(e)}")
        self_cleanup(temp_dir)
        return json_error("Não foi possível processar este vídeo. Verifique a URL e tente novamente.", 500)

def self_cleanup(path):
    try:
        if os.path.exists(path):
            import shutil
            shutil.rmtree(path, ignore_errors=True)
    except Exception:
        pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
