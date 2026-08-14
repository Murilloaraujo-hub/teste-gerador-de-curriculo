/* ============================================
   APP.JS — Inicialização e orquestração
   ============================================ */

const App = (() => {
  let timerAutoSave = null;

  function inicializar() {
    carregarConfiguracoes();
    Preview.inicializar();
    Editor.inicializar();
    Exportacao.inicializar();

    Editor.aoAlterar(debounceAtualizar);

    configurarCabecalho();
    configurarModalContinuar();
    aplicarZoomInicial();

    Preview.atualizar(Editor.obterDados());
  }

  const debounceAtualizar = Utils.debounce((dados) => {
    Preview.atualizar(dados);
    salvarAuto(dados);
  }, 150);

  function salvarAuto(dados) {
    clearTimeout(timerAutoSave);
    timerAutoSave = setTimeout(() => {
      Storage.salvarCurriculo(dados);
    }, 800);
  }

  function configurarCabecalho() {
    document.getElementById('btn-novo-curriculo')?.addEventListener('click', novoCurriculo);
    document.getElementById('btn-salvar')?.addEventListener('click', salvarManual);
    document.getElementById('btn-trocar-modelo')?.addEventListener('click', abrirModalModelos);
    document.getElementById('btn-tema')?.addEventListener('click', alternarTema);
    document.getElementById('btn-limpar')?.addEventListener('click', limparTudo);

    document.getElementById('zoom-menos')?.addEventListener('click', () => {
      Preview.definirZoom(Preview.obterZoom() - 0.1);
    });
    document.getElementById('zoom-mais')?.addEventListener('click', () => {
      Preview.definirZoom(Preview.obterZoom() + 0.1);
    });

    document.getElementById('chk-margens')?.addEventListener('change', (e) => {
      Preview.alternarMargensGuia(e.target.checked);
    });
    document.getElementById('chk-guias')?.addEventListener('change', (e) => {
      Preview.alternarLinhasGuia(e.target.checked);
    });
  }

  async function configurarModalContinuar() {
    if (!Storage.existeCurriculoSalvo()) return;
    const resposta = await Utils.mostrarModal(
      'Continuar editando?',
      '<p style="color: var(--cor-texto-suave);">Encontramos um currículo salvo anteriormente. Deseja continuar editando?</p>',
      [
        { texto: 'Começar do zero', classe: 'btn-secundario', valor: 'novo' },
        { texto: 'Continuar', classe: 'btn-primario', valor: 'continuar' },
      ]
    );
    if (resposta === 'continuar') {
      const dados = Storage.carregarCurriculo();
      if (dados) Editor.definirDados(dados);
    } else if (resposta === 'novo') {
      Storage.limparCurriculo();
    }
  }

  function carregarConfiguracoes() {
    const config = Storage.carregarConfiguracao();
    if (config.tema === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    const templateId = Storage.carregarTemplate();
    Preview.definirTemplate(templateId);
  }

  function alternarTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novo = atual === 'dark' ? 'light' : 'dark';
    if (novo === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    Storage.salvarConfiguracao({ tema: novo });
  }

  function aplicarZoomInicial() {
    const largura = window.innerWidth;
    let zoom = 1;
    if (largura < 560) zoom = 0.55;
    else if (largura < 960) zoom = 0.75;
    else if (largura < 1280) zoom = 0.9;
    Preview.definirZoom(zoom);
  }

  async function novoCurriculo() {
    const confirmar = await Utils.mostrarModal(
      'Novo currículo',
      '<p style="color: var(--cor-texto-suave);">Deseja iniciar um novo currículo? Os dados atuais não serão perdidos se estiverem salvos.</p>',
      [
        { texto: 'Cancelar', classe: 'btn-secundario', valor: 'cancelar' },
        { texto: 'Novo currículo', classe: 'btn-primario', valor: 'novo' },
      ]
    );
    if (confirmar === 'novo') {
      Editor.limparTudo();
      Utils.mostrarToast('Novo currículo iniciado', 'sucesso');
    }
  }

  function salvarManual() {
    const ok = Storage.salvarCurriculo(Editor.obterDados());
    Utils.mostrarToast(ok ? 'Currículo salvo!' : 'Erro ao salvar', ok ? 'sucesso' : 'perigo');
  }

  async function limparTudo() {
    const confirmar = await Utils.mostrarModal(
      'Limpar tudo?',
      '<p style="color: var(--cor-perigo);">Esta ação irá apagar todos os dados do currículo atual. Esta ação não pode ser desfeita.</p>',
      [
        { texto: 'Cancelar', classe: 'btn-secundario', valor: 'cancelar' },
        { texto: 'Sim, limpar', classe: 'btn-perigo', valor: 'limpar' },
      ]
    );
    if (confirmar === 'limpar') {
      Editor.limparTudo();
      Utils.mostrarToast('Dados apagados', 'alerta');
    }
  }

  async function abrirModalModelos() {
    const templateAtual = Storage.carregarTemplate();
    const cardsHtml = Templates.lista.map(t => `
      <div class="template-card ${t.id === templateAtual ? 'ativo' : ''}" data-template="${t.id}">
        <div class="template-card-mini">
          <div class="mini-titulo">${t.nome}</div>
          <div class="mini-linha"></div>
          <div class="mini-linha" style="width: 70%;"></div>
          <div class="mini-linha"></div>
          <div class="mini-linha" style="width: 60%;"></div>
        </div>
        <div class="template-card-nome">${t.nome}</div>
      </div>
    `).join('');

    const fundo = document.createElement('div');
    fundo.className = 'modal-fundo';
    fundo.innerHTML = `
      <div class="modal" style="max-width: 720px;">
        <div class="modal-titulo">Escolha um modelo</div>
        <div class="grade-templates">${cardsHtml}</div>
        <div class="modal-acoes">
          <button class="btn btn-secundario" id="fechar-modelos">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(fundo);

    fundo.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.template;
        Preview.definirTemplate(id);
        Preview.atualizar(Editor.obterDados());
        fundo.querySelectorAll('.template-card').forEach(c => c.classList.remove('ativo'));
        card.classList.add('ativo');
        Utils.mostrarToast(`Modelo "${Templates.lista.find(t => t.id === id).nome}" aplicado`, 'sucesso');
      });
    });

    const fechar = () => fundo.remove();
    fundo.querySelector('#fechar-modelos').onclick = fechar;
    fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
  }

  window.addEventListener('resize', Utils.debounce(aplicarZoomInicial, 200));

  document.addEventListener('DOMContentLoaded', inicializar);

  return { inicializar };
})();
