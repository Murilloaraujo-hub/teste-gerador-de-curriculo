/* ============================================
   UTILS.JS — Funções utilitárias reutilizáveis
   ============================================ */

const Utils = (() => {
  function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function debounce(fn, espera = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(null, args), espera);
    };
  }

  function escaparHtml(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatarData(valor) {
    if (!valor) return '';
    if (/^\d{4}-\d{2}$/.test(valor)) {
      const [ano, mes] = valor.split('-');
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                     'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return `${meses[parseInt(mes, 10) - 1]}/${ano}`;
    }
    return valor;
  }

  function validarEmail(email) {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarTelefone(telefone) {
    if (!telefone) return true;
    const digitos = telefone.replace(/\D/g, '');
    return digitos.length >= 10 && digitos.length <= 13;
  }

  function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duracao);
  }

  function mostrarModal(titulo, corpoHtml, acoes) {
    return new Promise((resolver) => {
      const fundo = document.createElement('div');
      fundo.className = 'modal-fundo';
      fundo.innerHTML = `
        <div class="modal">
          <div class="modal-titulo">${escaparHtml(titulo)}</div>
          <div class="modal-corpo">${corpoHtml}</div>
          <div class="modal-acoes"></div>
        </div>
      `;
      document.body.appendChild(fundo);

      const acoesContainer = fundo.querySelector('.modal-acoes');
      acoes.forEach((acao) => {
        const botao = document.createElement('button');
        botao.className = `btn ${acao.classe || 'btn-secundario'}`;
        botao.textContent = acao.texto;
        botao.onclick = () => {
          fechar();
          resolver(acao.valor);
        };
        acoesContainer.appendChild(botao);
      });

      const fechar = () => fundo.remove();
      fundo.addEventListener('click', (e) => {
        if (e.target === fundo) {
          fechar();
          resolver(null);
        }
      });
    });
  }

  function nomeArquivoSeguro(nome) {
    return (nome || 'Curriculo')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'Curriculo';
  }

  function baixarArquivo(conteudo, nomeArquivo, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    gerarId,
    debounce,
    escaparHtml,
    formatarData,
    validarEmail,
    validarTelefone,
    mostrarToast,
    mostrarModal,
    nomeArquivoSeguro,
    baixarArquivo,
  };
})();
