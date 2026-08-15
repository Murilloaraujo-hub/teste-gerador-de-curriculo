#!/usr/bin/env python3
"""
Servidor local simples para o Gerador de Currículos A4.

Por que existe?
    O gerador funciona abrindo o index.html diretamente no navegador,
    mas usar um servidor HTTP local evita eventuais restrições do
    navegador com file:// (upload de foto, importação de JSON etc.).

Uso:
    python app.py

Depois, abra no navegador o endereço indicado (padrão: http://localhost:8000).

Este arquivo NÃO contém HTML, CSS ou JavaScript embutidos — ele apenas
serve os arquivos estáticos do diretório atual.
"""

from __future__ import annotations

import http.server
import os
import socketserver
import sys
import webbrowser
from functools import partial

PORT = int(os.environ.get("PORT", "8000"))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Servidor de arquivos estáticos com logs mais enxutos."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, fmt, *args):
        # Log compacto: METHOD path status
        sys.stdout.write(
            "[curriculo] %s - %s\n" % (self.address_string(), fmt % args)
        )


def main() -> int:
    Handler = partial(QuietHandler)

    # Reutiliza a porta caso o servidor seja reiniciado logo em seguida
    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}/index.html"
            print("=" * 60)
            print("  Gerador de Currículos A4")
            print("-" * 60)
            print(f"  Servidor ativo em:  {url}")
            print(f"  Diretório:          {DIRECTORY}")
            print("  Pressione Ctrl+C para encerrar.")
            print("=" * 60)

            # Tenta abrir o navegador automaticamente (falha silenciosa
            # se estiver rodando em um ambiente sem interface gráfica)
            if "--no-browser" not in sys.argv:
                try:
                    webbrowser.open(url)
                except Exception:
                    pass

            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n[curriculo] Servidor encerrado.")
    except OSError as exc:
        if "Address already in use" in str(exc):
            print(
                f"[curriculo] A porta {PORT} já está em uso.\n"
                f"  • Feche o outro processo ou execute: PORT=8001 python app.py",
                file=sys.stderr,
            )
            return 1
        raise
    return 0


if __name__ == "__main__":
    sys.exit(main())
