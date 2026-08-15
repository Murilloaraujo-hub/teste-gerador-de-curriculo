# 🎵 Video2MP3 — Conversor de Vídeos para MP3

O **Video2MP3** é uma solução completa de conversão de vídeos autorizados para arquivos de áudio MP3 de alta fidelidade. O projeto possui uma arquitetura desacoplada onde o **Frontend** é estático e hospedado no **GitHub Pages** e o **Backend** é uma API REST em Python hospedada no **Render** com integração ao **FFmpeg**.

> ⚠️ **AVISO LEGAL E DE USO RESPONSÁVEL**: Este sistema deve ser utilizado exclusivamente para vídeos em que o usuário possua direitos ou autorização prévia para baixar ou converter. O projeto não implementa e não contorna mecanismos de DRM, autenticação, paywalls, vídeos privados ou restrições de plataformas.

---

## 🚀 1. O que é o Projeto

O Video2MP3 permite ao usuário:
1. Inserir a URL de um vídeo público do YouTube.
2. Obter as informações do conteúdo (Título, Canal, Duração, Thumbnail).
3. Selecionar a qualidade do áudio desejada (**128 kbps**, **192 kbps (Padrão)**, **256 kbps** ou **320 kbps**).
4. Processar a conversão através do FFmpeg no servidor backend.
5. Baixar o arquivo MP3 codificado com cabeçalho `audio/mpeg` nativo.

---

## 🛠️ 2. Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica e responsiva.
- **CSS3**: Layout moderno, tema escuro, variáveis CSS e suporte a dispositivos móveis.
- **JavaScript (ES6+)**: Validação de URLs, requisições HTTP assíncronas (Fetch API), barra de progresso e gerenciamento de downloads.
- **Hospedagem**: GitHub Pages.

### Backend
- **Python 3.11**: Linguagem principal.
- **Flask**: Framework REST API leve.
- **FFmpeg**: Ferramenta de linha de comando para codificação real em áudio MP3 (usando `libmp3lame`).
- **yt-dlp**: Extrator seguro de streams de mídia.
- **Gunicorn**: Servidor WSGI para produção.
- **Dockerfile**: Imagem de contêiner automatizada.
- **Hospedagem**: Render (Web Service com Docker).

---

## 📁 3. Estrutura das Pastas

```text
Video2MP3/
│
├── frontend/
│   ├── index.html       # Interface do usuário (HTML5)
│   ├── style.css        # Estilos modernos escuros e responsivos
│   └── script.js        # Lógica de integração e animação
│
├── backend/
│   ├── app.py           # API REST em Flask + subprocess FFmpeg
│   ├── requirements.txt # Dependências de pacotes Python
│   ├── Dockerfile       # Configuração da imagem Linux + FFmpeg
│   └── .gitignore       # Arquivos ignorados pelo Git
│
└── README.md            # Documentação completa
```

---

## 💻 4. Como Instalar o Python Localmente

### Windows
1. Acesse o site oficial: [python.org/downloads](https://www.python.org/downloads/).
2. Baixe o instalador do **Python 3.11** ou superior.
3. **IMPORTANTE**: Marque a opção **"Add python.exe to PATH"** antes de clicar em Instalar.

### macOS (Homebrew)
```bash
brew install python
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv -y
```

---

## 🎬 5. Como Instalar o FFmpeg Localmente

O FFmpeg é obrigatório no ambiente do backend para realizar a conversão real do áudio.

### Windows
1. Baixe os binários compilados em [ffmpeg.org/download.html](https://ffmpeg.org/download.html) ou via Winget:
   ```cmd
   winget install FFmpeg
   ```
2. Adicione a pasta `bin` do FFmpeg às Variáveis de Ambiente do Sistema (PATH).

### macOS
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg -y
```

Verifique a instalação digitando no terminal:
```bash
ffmpeg -version
```

---

## ⚙️ 6. Como Executar o Backend Localmente

1. Navegue até a pasta `backend`:
   ```bash
   cd Video2MP3/backend
   ```
2. Crie e ative um ambiente virtual:
   - **Linux/macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows**:
     ```cmd
     python -m venv venv
     venv\Scripts\activate
     ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Execute o servidor Flask:
   ```bash
   python app.py
   ```
O servidor estará rodando em `http://127.0.0.1:5000`.

---

## 🌐 7. Como Executar o Frontend Localmente

1. Abra a pasta `frontend` em qualquer servidor web local. Por exemplo:
   - Extensão **Live Server** do VS Code.
   - Ou executando o comando Python na pasta `frontend`:
     ```bash
     cd Video2MP3/frontend
     python -m http.server 8000
     ```
2. Acesse `http://localhost:8000` no seu navegador.
3. No menu do site, clique no ícone **⚙️ API** e informe a URL da sua API local (`http://127.0.0.1:5000`).

---

## 🐙 8. Como Criar o Repositório no GitHub

1. Acesse [github.com/new](https://github.com/new).
2. Nomeie o repositório como `Video2MP3`.
3. Escolha a visibilidade como **Público**.
4. No terminal da pasta raiz `Video2MP3/`, inicialize e envie o código:
   ```bash
   git init
   git add .
   git commit -m "Inicializando projeto Video2MP3 completo"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/Video2MP3.git
   git push -u origin main
   ```

---

## 📄 9. Como Publicar o Frontend no GitHub Pages

1. Vá até o repositório no GitHub: `https://github.com/SEU-USUARIO/Video2MP3`.
2. Clique em **Settings** > **Pages**.
3. Em **Build and deployment**:
   - **Source**: Deploy from a branch.
   - **Branch**: `main` / pasta `/frontend` (ou utilize GitHub Actions para a pasta `frontend`).
4. Clique em **Save**.
5. Em poucos minutos seu frontend estará acessível em:
   `https://SEU-USUARIO.github.io/Video2MP3`

---

## 🚀 10. Como Criar o Serviço no Render (Backend)

1. Cadastre-se em [render.com](https://render.com).
2. No painel do Render, clique em **New +** > **Web Service**.
3. Conecte sua conta do GitHub e selecione o repositório `Video2MP3`.
4. Defina os campos de configuração:
   - **Name**: `video2mp3-backend`
   - **Region**: Escolha a mais próxima de você (ex: Oregon / Frankfurt).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: **Docker** (o Render detectará o `Dockerfile` automaticamente).
5. Clique em **Create Web Service**.

---

## 🔐 11. Como Configurar as Variáveis de Ambiente

No painel do seu serviço no Render, vá até **Environment** e adicione:

| Chave | Exemplo de Valor | Descrição |
|-------|------------------|-----------|
| `PORT` | `10000` | Porta fornecida dinamicamente pelo Render |
| `FRONTEND_URL` | `https://SEU-USUARIO.github.io` | Domínio do seu frontend no GitHub Pages para permissão CORS |
| `MAX_FILE_SIZE_MB` | `500` | Limite máximo de tamanho do arquivo em Megabytes |
| `MAX_CONCURRENT_JOBS` | `3` | Limite de processamentos simultâneos recomendados |

---

## 🔒 12. Como Configurar CORS

No arquivo `backend/app.py`, o CORS está configurado para permitir requisições estritas do seu domínio no GitHub Pages através da variável `FRONTEND_URL`:

```python
FRONTEND_URL = os.environ.get('FRONTEND_URL', '*')
if FRONTEND_URL and FRONTEND_URL != '*':
    CORS(app, origins=[FRONTEND_URL], supports_credentials=True)
```

Isso garante que domínios não autorizados não possam consumir os recursos do seu servidor no Render.

---

## 🔗 13. Como Conectar o GitHub Pages ao Render

No arquivo `frontend/script.js`, altere a variável `API_URL` para apontar para o seu endereço no Render:

```javascript
let API_URL = "https://seu-backend.onrender.com";
```

Você também pode alterar a URL da API em tempo de execução diretamente na interface do site clicando em **⚙️ API** na barra superior.

---

## 🔄 14. Como Atualizar o Projeto

Sempre que fizer alterações no código local:
```bash
git add .
git commit -m "Atualizando funcionalidades do Video2MP3"
git push origin main
```
- O **GitHub Pages** atualizará a interface estática automaticamente.
- O **Render** detectará os novos commits e fará o re-deploy automático do contêiner Docker.

---

## ⏱️ 15. Limitações do Plano Gratuito do Render

Ao utilizar o plano gratuito (*Free Tier*) do Render:
1. **Sleep mode (Hibernação)**: O serviço entra em hibernação após 15 minutos sem receber requisições. A primeira requisição após a hibernação pode levar entre 30 e 50 segundos para "acordar" a API.
2. **Limite de Memória (RAM)**: O plano gratuito disponibiliza 512 MB de RAM. É recomendável não tentar converter arquivos extremamente longos (acima de 2 horas).
3. **Horas Gratuitas**: O Render oferece 750 horas de execução gratuitas por mês, suficientes para manter o serviço ativo.

---

### 🛡️ Licença e Responsabilidade
Este software é fornecido para fins educacionais e de conversão de conteúdo autorizado. Respeite os termos de serviço das plataformas e os direitos de autor.
