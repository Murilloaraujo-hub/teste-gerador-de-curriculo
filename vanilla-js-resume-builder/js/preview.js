/* ============================================
   PREVIEW.JS — Atualização da pré-visualização
   ============================================ */

const Preview = (() => {
  let elementoFolha = null;
  let templateAtual = 'tradicional';
  let zoomAtual = 1;

  function inicializar() {
    elementoFolha = document.getElementById('folha');
  }

  function definirTemplate(templateId) {
    templateAtual = templateId;
    Storage.salvarTemplate(templateId);
  }

  function atualizar(dados) {
    if (!elementoFolha) return;
    const temDados = dados.nome || dados.email || dados.telefone ||
                     (dados.experiencias && dados.experiencias.length) ||
                     (dados.escolaridade && dados.escolaridade.length);

    if (!temDados && !dados.nome) {
      elementoFolha.innerHTML = '<div class="cv-vazio">Comece preenchendo seus dados para visualizar o currículo aqui.</div>';
      return;
    }
    elementoFolha.innerHTML = Templates.gerarHtml(templateAtual, dados);
  }

  function definirZoom(valor) {
    zoomAtual = Math.max(0.5, Math.min(1.5, valor));
    const wrapper = document.querySelector('.folha-wrapper');
    if (wrapper) wrapper.style.transform = `scale(${zoomAtual})`;
    const label = document.getElementById('zoom-valor');
    if (label) label.textContent = Math.round(zoomAtual * 100) + '%';
    return zoomAtual;
  }

  function obterZoom() { return zoomAtual; }

  function alternarMargensGuia(ativo) {
    if (!elementoFolha) return;
    elementoFolha.classList.toggle('com-margens-guia', ativo);
  }

  function alternarLinhasGuia(ativo) {
    const painel = document.querySelector('.painel-visualizacao');
    if (painel) painel.classList.toggle('sem-guia', !ativo);
  }

  function obterElementoFolha() { return elementoFolha; }

  return {
    inicializar,
    definirTemplate,
    atualizar,
    definirZoom,
    obterZoom,
    alternarMargensGuia,
    alternarLinhasGuia,
    obterElementoFolha,
  };
})();
