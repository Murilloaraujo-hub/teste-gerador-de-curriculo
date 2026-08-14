"""
app.py — Servidor HTTP local opcional para o Currículo Maker.

Uso:
    python app.py
    python app.py 8080    # porta personalizada

Depois acesse no navegador:
    http://localhost:8000

O projeto também funciona abrindo "index.html" diretamente no navegador,
sem precisar deste servidor. Este arquivo é apenas uma conveniência
para quem prefere acessar via HTTP local (útil em alguns navegadores
que restringem recursos via file://).

Requisitos: Python 3 (somente biblioteca padrão, sem instalação de pacotes).
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading

PORTA_PADRAO = 8000
ABRIR_NAVEGADOR = True


def obter_porta():
    """Lê a porta via argumento de linha de comando, se fornecida."""
    if len(sys.argv) > 1:
        try:
            return int(sys.argv[1])
        except ValueError:
            print(f"Porta inválida: {sys.argv[1]}. Usando {PORTA_PADRAO}.")
    return PORTA_PADRAO


def abrir_navegador_apos_delay(url):
    """Abre o navegador automaticamente após pequeno delay."""
    def _abrir():
        import time
        time.sleep(1.0)
        webbrowser.open(url)
    threading.Thread(target=_abrir, daemon=True).start()


def main():
    porta = obter_porta()
    diretorio = os.path.dirname(os.path.abspath(__file__)) or os.getcwd()
    os.chdir(diretorio)

    manipulador = http.server.SimpleHTTPRequestHandler
    # Silencia logs detalhados no console (apenas erros)
    manipulador.log_message = lambda *args, **kwargs: None

    try:
        with socketserver.TCPServer(("", porta), manipulador) as httpd:
            url = f"http://localhost:{porta}"
            print("=" * 60)
            print("  Currículo Maker — Servidor Local")
            print("=" * 60)
            print(f"  Servindo em: {url}")
            print(f"  Diretório:   {diretorio}")
            print("-" * 60)
            print("  Pressione Ctrl+C para encerrar.")
            print("=" * 60)

            if ABRIR_NAVEGADOR:
                abrir_navegador_apos_delay(url)

            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServidor encerrado pelo usuário.")
    except OSError as e:
        if e.errno == 48 or e.errno == 98 or "already in use" in str(e).lower():
            print(f"Erro: a porta {porta} já está em uso.")
            print(f"Tente outra porta: python app.py <numero_da_porta>")
        else:
            raise


if __name__ == "__main__":
    main()
