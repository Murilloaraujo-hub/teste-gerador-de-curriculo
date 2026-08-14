/* ============================================
   SCRIPT.JS — Lógica principal consolidada
   Currículo Maker - Versão aprimorada
   ============================================ */

/* ============================
   UTILS — Funções auxiliares
   ============================ */
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
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function formatarData(valor) {
    if (!valor) return '';
    if (/^\d{4}-\d{2}$/.test(valor)) {
      const [ano, mes] = valor.split('-');
      const meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
      return `${meses[parseInt(mes, 10) - 1]}/${ano}`;
    }
    return valor;
  }
  function validarEmail(email) {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function validarTelefone(tel) {
    if (!tel) return true;
    const d = tel.replace(/\D/g, '');
    return d.length >= 10 && d.length <= 13;
  }
  function mostrarToast(msg, tipo = 'info', duracao = 2500) {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      t.style.transition = 'all 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, duracao);
  }
  function mostrarModal(titulo, corpo, acoes) {
    return new Promise((resolver) => {
      const fundo = document.createElement('div');
      fundo.className = 'modal-fundo';
      fundo.innerHTML = `
        <div class="modal">
          <div class="modal-titulo">${escaparHtml(titulo)}</div>
          <div class="modal-corpo">${corpo}</div>
          <div class="modal-acoes"></div>
        </div>`;
      document.body.appendChild(fundo);
      const ac = fundo.querySelector('.modal-acoes');
      acoes.forEach(a => {
        const b = document.createElement('button');
        b.className = `btn ${a.classe || 'btn-secundario'}`;
        b.textContent = a.texto;
        b.onclick = () => { fundo.remove(); resolver(a.valor); };
        ac.appendChild(b);
      });
      fundo.addEventListener('click', (e) => {
        if (e.target === fundo) { fundo.remove(); resolver(null); }
      });
    });
  }
  function nomeArquivoSeguro(nome) {
    return (nome || 'Curriculo')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'Curriculo';
  }
  function baixarArquivo(conteudo, nome, tipo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = nome; link.click();
    URL.revokeObjectURL(url);
  }
  return { gerarId, debounce, escaparHtml, formatarData, validarEmail, validarTelefone,
           mostrarToast, mostrarModal, nomeArquivoSeguro, baixarArquivo };
})();

/* ============================
   STORAGE — LocalStorage
   ============================ */
const Storage = (() => {
  const CHAVE_DADOS = 'cm_dados_v2';
  const CHAVE_CONFIG = 'cm_config_v2';
  function salvarDados(d) {
    try { localStorage.setItem(CHAVE_DADOS, JSON.stringify(d)); return true; }
    catch (e) { return false; }
  }
  function carregarDados() {
    try {
      const d = localStorage.getItem(CHAVE_DADOS);
      return d ? JSON.parse(d) : null;
    } catch (e) { return null; }
  }
  function limparDados() { localStorage.removeItem(CHAVE_DADOS); }
  function salvarConfig(c) {
    try { localStorage.setItem(CHAVE_CONFIG, JSON.stringify(c)); return true; }
    catch (e) { return false; }
  }
  function carregarConfig() {
    try {
      const d = localStorage.getItem(CHAVE_CONFIG);
      return d ? JSON.parse(d) : null;
    } catch (e) { return null; }
  }
  function existeDados() { return !!localStorage.getItem(CHAVE_DADOS); }
  return { salvarDados, carregarDados, limparDados, salvarConfig, carregarConfig, existeDados };
})();

/* ============================
   TEMPLATES — Modelos de currículo
   ============================ */
const Templates = (() => {
  const esc = Utils.escaparHtml;
  const fmt = Utils.formatarData;

  const MODELOS = [
    { id: 'classico', nome: 'Clássico' },
    { id: 'moderno', nome: 'Moderno' },
    { id: 'minimalista', nome: 'Minimalista' },
  ];

  const SECOES_DISPONIVEIS = [
    { id: 'objetivo', nome: 'Objetivo' },
    { id: 'experiencias', nome: 'Experiência' },
    { id: 'escolaridade', nome: 'Formação' },
    { id: 'habilidades', nome: 'Habilidades' },
    { id: 'idiomas', nome: 'Idiomas' },
    { id: 'cursos', nome: 'Cursos' },
    { id: 'certificacoes', nome: 'Certificações' },
    { id: 'projetos', nome: 'Projetos' },
    { id: 'informacoesAdicionais', nome: 'Informações Adicionais' },
  ];

  function contatosHtml(d) {
    const i = [];
    if (d.telefone) i.push(esc(d.telefone));
    if (d.email) i.push(esc(d.email));
    if (d.cidade && d.estado) i.push(`${esc(d.cidade)}/${esc(d.estado)}`);
    if (d.linkedin) i.push(`<a class="cv-link" href="${esc(d.linkedin)}" target="_blank">LinkedIn</a>`);
    if (d.github) i.push(`<a class="cv-link" href="${esc(d.github)}" target="_blank">GitHub</a>`);
    return i.length ? `<div class="cv-contatos">${i.join(' • ')}</div>` : '';
  }

  function cabecalhoHtml(d, cfg) {
    const nome = `<div class="cv-nome">${esc(d.nome) || 'Seu Nome'}</div>`;
    const prof = d.profissao ? `<div class="cv-profissao">${esc(d.profissao)}</div>` : '';
    const cont = contatosHtml(d);
    const foto = (cfg.mostrarFoto && d.foto)
      ? `<img class="cv-foto" src="${esc(d.foto)}" alt="Foto">` : '';
    const inline = foto && cfg.templateId === 'moderno';
    if (inline) {
      return `<div class="cv-cabecalho cv-cabecalho-com-foto">${foto}<div>${nome}${prof}${cont}</div></div>`;
    }
    return `<div class="cv-cabecalho">${foto}${nome}${prof}${cont}</div>`;
  }

  function secaoTexto(titulo, texto) {
    if (!texto) return '';
    return `<div class="cv-secao">
      <div class="cv-secao-titulo">${esc(titulo)}</div>
      <div class="cv-secao-texto">${esc(texto)}</div>
    </div>`;
  }

  function experienciasHtml(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(e => {
      const p = e.atual ? `${fmt(e.inicio)} – o momento`
        : `${fmt(e.inicio)}${e.fim ? ' – ' + fmt(e.fim) : ''}`;
      return `<div class="cv-item">
        <div class="cv-item-cabecalho">
          <div class="cv-item-titulo">${esc(e.cargo)}</div>
          <div class="cv-item-periodo">${esc(p)}</div>
        </div>
        <div class="cv-item-subtitulo">${esc(e.empresa)}${e.cidade ? ' • ' + esc(e.cidade) : ''}</div>
        ${e.descricao ? `<div class="cv-item-descricao">${esc(e.descricao)}</div>` : ''}
      </div>`;
    }).join('');
    return `<div class="cv-secao"><div class="cv-secao-titulo">Experiência Profissional</div>${itens}</div>`;
  }

  function escolaridadeHtml(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(e => {
      const p = `${fmt(e.inicio)}${e.fim ? ' – ' + fmt(e.fim) : ''}`;
      return `<div class="cv-item">
        <div class="cv-item-cabecalho">
          <div class="cv-item-titulo">${esc(e.curso)}</div>
          <div class="cv-item-periodo">${esc(p)}</div>
        </div>
        <div class="cv-item-subtitulo">${esc(e.instituicao)}</div>
        ${e.descricao ? `<div class="cv-item-descricao">${esc(e.descricao)}</div>` : ''}
      </div>`;
    }).join('');
    return `<div class="cv-secao"><div class="cv-secao-titulo">Formação Acadêmica</div>${itens}</div>`;
  }

  function cursosHtml(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(c => `<div class="cv-item">
      <div class="cv-item-cabecalho">
        <div class="cv-item-titulo">${esc(c.nome)}</div>
        <div class="cv-item-periodo">${esc(c.ano)}${c.cargaHoraria ? ' • ' + esc(c.cargaHoraria) + 'h' : ''}</div>
      </div>
      <div class="cv-item-subtitulo">${esc(c.instituicao)}</div>
    </div>`).join('');
    return `<div class="cv-secao"><div class="cv-secao-titulo">Cursos</div>${itens}</div>`;
  }

  function certificacoesHtml(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(c => `<div class="cv-item">
      <div class="cv-item-cabecalho">
        <div class="cv-item-titulo">${esc(c.nome)}</div>
        <div class="cv-item-periodo">${esc(c.ano)}</div>
      </div>
      <div class="cv-item-subtitulo">${esc(c.instituicao)}</div>
    </div>`).join('');
    return `<div class="cv-secao"><div class="cv-secao-titulo">Certificações</div>${itens}</div>`;
  }

  function habilidadesHtml(lista) {
    if (!lista || !lista.length) return '';
    const tags = lista.map(h => `<span class="cv-habilidade-tag">${esc(h.nome || h)}</span>`).join('');
    return `<div class="cv-secao"><div class="cv-secao-titulo">Habilidades</div>
      <div class="cv-habilidades">${tags}</div></div>`;
  }

  function idiomasHtml(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(i => `<span class="cv-idioma"><strong>${esc(i.idioma)}</strong> – ${esc(i.nivel)}</span>`).join(' • ');
    return `<div class="cv-secao"><div class="cv-secao-titulo">Idiomas</div>
      <div class="cv-idiomas-lista">${itens}</div></div>`;
  }

  function projetosHtml(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(p => `<div class="cv-item">
      <div class="cv-item-cabecalho">
        <div class="cv-item-titulo">${esc(p.nome)}</div>
        ${p.link ? `<div><a class="cv-link" href="${esc(p.link)}" target="_blank">Ver</a></div>` : ''}
      </div>
      ${p.tecnologias ? `<div class="cv-item-subtitulo">${esc(p.tecnologias)}</div>` : ''}
      ${p.descricao ? `<div class="cv-item-descricao">${esc(p.descricao)}</div>` : ''}
    </div>`).join('');
    return `<div class="cv-secao"><div class="cv-secao-titulo">Projetos</div>${itens}</div>`;
  }

  function renderizarSecao(id, dados) {
    switch (id) {
      case 'objetivo': return secaoTexto('Objetivo', dados.objetivo);
      case 'experiencias': return experienciasHtml(dados.experiencias);
      case 'escolaridade': return escolaridadeHtml(dados.escolaridade);
      case 'habilidades': return habilidadesHtml(dados.habilidades);
      case 'idiomas': return idiomasHtml(dados.idiomas);
      case 'cursos': return cursosHtml(dados.cursos);
      case 'certificacoes': return certificacoesHtml(dados.certificacoes);
      case 'projetos': return projetosHtml(dados.projetos);
      case 'informacoesAdicionais': return secaoTexto('Informações Adicionais', dados.informacoesAdicionais);
      default: return '';
    }
  }

  function gerarHtml(dados, cfg) {
    const cabecalho = cabecalhoHtml(dados, cfg);
    const ordem = cfg.ordemSecoes || SECOES_DISPONIVEIS.map(s => s.id);
    const secoes = ordem.map(id => renderizarSecao(id, dados)).join('');
    return `<div class="template-${cfg.templateId}">${cabecalho}${secoes}</div>`;
  }

  return { MODELOS, SECOES_DISPONIVEIS, gerarHtml };
})();

/* ============================
   PREVIEW — Pré-visualização A4
   ============================ */
const Preview = (() => {
  let folhasContainer = null;
  let indicador = null;
  let zoomAtual = 1;

  function inicializar() {
    folhasContainer = document.getElementById('folhas-container');
    indicador = document.getElementById('indicador-paginas');
  }

  function atualizar(dados, cfg) {
    if (!folhasContainer) return;
    const temDados = dados.nome || dados.email || dados.telefone ||
                     (dados.experiencias && dados.experiencias.length) ||
                     (dados.escolaridade && dados.escolaridade.length);
    if (!temDados && !dados.nome) {
      folhasContainer.innerHTML = '<div class="folha"><div class="cv-vazio">Comece preenchendo seus dados para visualizar o currículo aqui.</div></div>';
      atualizarIndicador(1);
      return;
    }
    folhasContainer.innerHTML = `<div class="folha" id="folha-principal">${Templates.gerarHtml(dados, cfg)}</div>`;
    // Após renderizar, verifica se precisa de segunda página
    setTimeout(() => verificarPaginas(dados, cfg), 50);
  }

  function verificarPaginas(dados, cfg) {
    const folha = document.getElementById('folha-principal');
    if (!folha) return;
    // Altura A4 interna (297mm - 2*18mm de padding = 261mm)
    const alturaMaxPx = mmParaPx(261);
    const alturaReal = folha.scrollHeight;
    const numPaginas = Math.max(1, Math.ceil(alturaReal / alturaMaxPx));
    atualizarIndicador(numPaginas);
    // Se passar de 1 página, mostra aviso (mas permite naturalmente)
    folha.classList.toggle('conteudo-excesso', numPaginas > 1);
  }

  function mmParaPx(mm) {
    // Aproximação baseada em 96 DPI: 1mm ≈ 3.7795px
    return mm * 3.7795;
  }

  function atualizarIndicador(total) {
    if (!indicador) return;
    const icone = indicador.querySelector('.indicador-paginas-icone');
    const texto = indicador.querySelector('.indicador-paginas-texto');
    if (total === 1) {
      indicador.classList.remove('alerta');
      icone.textContent = '✓';
      texto.textContent = '1 página A4';
    } else {
      indicador.classList.add('alerta');
      icone.textContent = '⚠';
      texto.textContent = `${total} páginas A4`;
    }
  }

  function definirZoom(valor) {
    zoomAtual = Math.max(0.4, Math.min(1.3, valor));
    const wrappers = document.querySelectorAll('.folha-wrapper');
    wrappers.forEach(w => w.style.transform = `scale(${zoomAtual})`);
    const lbl = document.getElementById('zoom-valor');
    if (lbl) lbl.textContent = Math.round(zoomAtual * 100) + '%';
    return zoomAtual;
  }
  function obterZoom() { return zoomAtual; }

  function ajustarZoomAutomatico() {
    const largura = window.innerWidth;
    let z = 1;
    if (largura < 560) z = 0.5;
    else if (largura < 960) z = 0.7;
    else if (largura < 1280) z = 0.85;
    definirZoom(z);
  }

  return { inicializar, atualizar, definirZoom, obterZoom, ajustarZoomAutomatico };
})();

/* ============================
   EDITOR — Formulário e wizard
   ============================ */
const Editor = (() => {
  let dados = criarVazio();
  let etapaAtual = 1;
  const TOTAL_ETAPAS = 7;
  let aoAlterar = null;

  function criarVazio() {
    return {
      nome: '', profissao: '', telefone: '', email: '',
      cidade: '', estado: '', linkedin: '', github: '', foto: '',
      objetivo: '',
      escolaridade: [], experiencias: [],
      habilidades: [], idiomas: [],
      cursos: [], certificacoes: [], projetos: [], informacoesAdicionais: '',
    };
  }

  function obterDados() { return JSON.parse(JSON.stringify(dados)); }
  function definirDados(d) {
    dados = { ...criarVazio(), ...d };
    popularFormulario();
    notificar();
  }
  function onAlterar(cb) { aoAlterar = cb; }
  function notificar() { if (aoAlterar) aoAlterar(obterDados()); }

  function inicializar() {
    vincularCamposSimples();
    configurarFoto();
    configurarListas();
    configurarWizard();
  }

  function vincularCamposSimples() {
    const campos = ['nome','profissao','telefone','email','cidade','estado',
                    'linkedin','github','objetivo','informacoesAdicionais'];
    campos.forEach(c => {
      const el = document.getElementById(`campo-${c}`);
      if (!el) return;
      el.addEventListener('input', () => {
        dados[c] = el.value;
        validarCampo(el, c);
        atualizarContador(el);
        notificar();
      });
    });
  }

  function validarCampo(el, c) {
    let ok = true;
    if (c === 'email' && el.value) ok = Utils.validarEmail(el.value);
    if (c === 'telefone' && el.value) ok = Utils.validarTelefone(el.value);
    el.classList.toggle('campo-erro', !ok);
  }

  function atualizarContador(el) {
    const c = el.parentElement.querySelector('.campo-contador');
    if (c) c.textContent = `${el.value.length} caracteres`;
  }

  function configurarFoto() {
    const prev = document.getElementById('foto-preview');
    const inp = document.getElementById('campo-foto');
    const btnRem = document.getElementById('btn-remover-foto');
    if (!prev || !inp) return;
    prev.addEventListener('click', () => inp.click());
    inp.addEventListener('change', (e) => {
      const arq = e.target.files[0];
      if (!arq) return;
      const r = new FileReader();
      r.onload = (ev) => {
        dados.foto = ev.target.result;
        atualizarFotoPreview();
        notificar();
      };
      r.readAsDataURL(arq);
    });
    if (btnRem) btnRem.onclick = () => {
      dados.foto = '';
      inp.value = '';
      atualizarFotoPreview();
      notificar();
    };
  }

  function atualizarFotoPreview() {
    const prev = document.getElementById('foto-preview');
    if (!prev) return;
    prev.innerHTML = dados.foto ? `<img src="${dados.foto}" alt="Foto">` : '📷';
  }

  /* ---------- WIZARD ---------- */
  function configurarWizard() {
    document.querySelectorAll('.wizard-passo').forEach(p => {
      p.addEventListener('click', () => irParaEtapa(parseInt(p.dataset.etapa, 10)));
    });
    const btnAnt = document.getElementById('btn-anterior');
    const btnProx = document.getElementById('btn-proximo');
    if (btnAnt) btnAnt.onclick = () => irParaEtapa(etapaAtual - 1);
    if (btnProx) btnProx.onclick = () => irParaEtapa(etapaAtual + 1);
    irParaEtapa(1);
  }

  function irParaEtapa(n) {
    if (n < 1 || n > TOTAL_ETAPAS) return;
    etapaAtual = n;
    document.querySelectorAll('.wizard-etapa').forEach((el, i) => {
      el.classList.toggle('ativa', i + 1 === n);
    });
    document.querySelectorAll('.wizard-passo').forEach((el, i) => {
      el.classList.remove('ativo');
      el.classList.toggle('concluido', i + 1 < n);
    });
    const passo = document.querySelector(`.wizard-passo[data-etapa="${n}"]`);
    if (passo) passo.classList.add('ativo');
    document.getElementById('btn-anterior').disabled = n === 1;
    document.getElementById('btn-proximo').textContent = n === TOTAL_ETAPAS ? '✓ Concluir' : 'Próximo →';
    // Scroll suave do editor ao topo
    const painel = document.querySelector('.painel-editor');
    if (painel) painel.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- LISTAS DINÂMICAS ---------- */
  const configsListas = {
    escolaridade: {
      containerId: 'lista-escolaridade',
      campoPrincipal: 'curso', campoSub: 'instituicao',
      campos: [
        { nome: 'curso', rotulo: 'Curso', tipo: 'text' },
        { nome: 'instituicao', rotulo: 'Instituição', tipo: 'text' },
        { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
        { nome: 'fim', rotulo: 'Fim', tipo: 'month' },
        { nome: 'descricao', rotulo: 'Descrição (opcional)', tipo: 'textarea' },
      ],
    },
    experiencias: {
      containerId: 'lista-experiencias',
      campoPrincipal: 'cargo', campoSub: 'empresa',
      campos: [
        { nome: 'cargo', rotulo: 'Cargo', tipo: 'text' },
        { nome: 'empresa', rotulo: 'Empresa', tipo: 'text' },
        { nome: 'cidade', rotulo: 'Cidade', tipo: 'text' },
        { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
        { nome: 'fim', rotulo: 'Fim', tipo: 'month' },
        { nome: 'atual', rotulo: 'Emprego atual', tipo: 'checkbox' },
        { nome: 'descricao', rotulo: 'Descrição das atividades', tipo: 'textarea' },
      ],
    },
    cursos: {
      containerId: 'lista-cursos',
      campoPrincipal: 'nome', campoSub: 'instituicao',
      campos: [
        { nome: 'nome', rotulo: 'Nome do curso', tipo: 'text' },
        { nome: 'instituicao', rotulo: 'Instituição', tipo: 'text' },
        { nome: 'cargaHoraria', rotulo: 'Carga horária', tipo: 'number' },
        { nome: 'ano', rotulo: 'Ano', tipo: 'number' },
      ],
    },
    certificacoes: {
      containerId: 'lista-certificacoes',
      campoPrincipal: 'nome', campoSub: 'instituicao',
      campos: [
        { nome: 'nome', rotulo: 'Nome', tipo: 'text' },
        { nome: 'instituicao', rotulo: 'Instituição', tipo: 'text' },
        { nome: 'ano', rotulo: 'Ano', tipo: 'number' },
      ],
    },
    projetos: {
      containerId: 'lista-projetos',
      campoPrincipal: 'nome', campoSub: 'tecnologias',
      campos: [
        { nome: 'nome', rotulo: 'Nome do projeto', tipo: 'text' },
        { nome: 'tecnologias', rotulo: 'Tecnologias utilizadas', tipo: 'text' },
        { nome: 'link', rotulo: 'Link (opcional)', tipo: 'text' },
        { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
      ],
    },
    idiomas: {
      containerId: 'lista-idiomas',
      campoPrincipal: 'idioma', campoSub: 'nivel',
      campos: [
        { nome: 'idioma', rotulo: 'Idioma', tipo: 'text' },
        { nome: 'nivel', rotulo: 'Nível', tipo: 'select',
          opcoes: ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'] },
      ],
    },
    habilidades: {
      containerId: 'lista-habilidades',
      campoPrincipal: 'nome',
      modoTag: true,
    },
  };

  function configurarListas() {
    Object.keys(configsListas).forEach(chave => {
      const btn = document.getElementById(`btn-add-${chave}`);
      if (btn) btn.onclick = () => adicionarItem(chave);
      renderizarLista(chave);
    });
    // Campo de habilidades com Enter
    const inputHab = document.getElementById('input-habilidade-nova');
    if (inputHab) inputHab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = inputHab.value.trim();
        if (v) {
          adicionarItem('habilidades', { id: Utils.gerarId(), nome: v }, false);
          inputHab.value = '';
        }
      }
    });
  }

  function adicionarItem(chave, itemExistente = null, expandir = true) {
    const item = itemExistente || { id: Utils.gerarId() };
    if (!dados[chave]) dados[chave] = [];
    dados[chave].push(item);
    renderizarLista(chave);
    if (expandir && !itemExistente) {
      const cfg = configsListas[chave];
      if (cfg && !cfg.modoTag) {
        const container = document.getElementById(cfg.containerId);
        const ult = container?.lastElementChild;
        if (ult) {
          ult.classList.add('expandido');
          setTimeout(() => ult.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
      }
    }
    notificar();
  }

  function removerItem(chave, id) {
    dados[chave] = (dados[chave] || []).filter(i => i.id !== id);
    renderizarLista(chave);
    notificar();
  }

  function duplicarItem(chave, id) {
    const original = (dados[chave] || []).find(i => i.id === id);
    if (!original) return;
    const copia = { ...JSON.parse(JSON.stringify(original)), id: Utils.gerarId() };
    dados[chave].push(copia);
    renderizarLista(chave);
    notificar();
    Utils.mostrarToast('Item duplicado', 'sucesso');
  }

  function renderizarLista(chave) {
    const cfg = configsListas[chave];
    if (!cfg) return;
    const container = document.getElementById(cfg.containerId);
    if (!container) return;
    container.innerHTML = '';
    if (cfg.modoTag) {
      const wrap = document.createElement('div');
      wrap.className = 'tags-container';
      (dados[chave] || []).forEach(item => {
        const t = document.createElement('span');
        t.className = 'tag';
        t.innerHTML = `${Utils.escaparHtml(item.nome || '')} <span class="tag-remover">×</span>`;
        t.querySelector('.tag-remover').onclick = () => removerItem(chave, item.id);
        wrap.appendChild(t);
      });
      container.appendChild(wrap);
      return;
    }
    (dados[chave] || []).forEach(item => {
      container.appendChild(criarItem(chave, cfg, item));
    });
  }

  function criarItem(chave, cfg, item) {
    const el = document.createElement('div');
    el.className = 'lista-item animacao-aparecer';
    const titulo = item[cfg.campoPrincipal] || 'Novo item';
    const sub = cfg.campoSub && item[cfg.campoSub] ? ` — ${Utils.escaparHtml(item[cfg.campoSub])}` : '';
    el.innerHTML = `
      <div class="lista-item-cabecalho">
        <div>
          <div class="lista-item-titulo">${Utils.escaparHtml(titulo)}</div>
          ${sub ? `<div class="lista-item-subtitulo">${sub}</div>` : ''}
        </div>
        <div class="lista-item-acoes">
          <button class="btn-icone" data-acao="editar" title="Editar">✏️</button>
          <button class="btn-icone" data-acao="duplicar" title="Duplicar">📋</button>
          <button class="btn-icone" data-acao="excluir" title="Excluir">🗑️</button>
        </div>
      </div>
      <div class="lista-item-conteudo"></div>`;
    const corpo = el.querySelector('.lista-item-conteudo');
    corpo.appendChild(criarForm(chave, cfg, item));
    el.querySelector('[data-acao="editar"]').onclick = () => el.classList.toggle('expandido');
    el.querySelector('[data-acao="duplicar"]').onclick = () => duplicarItem(chave, item.id);
    el.querySelector('[data-acao="excluir"]').onclick = () => removerItem(chave, item.id);
    return el;
  }

  function criarForm(chave, cfg, item) {
    const form = document.createElement('div');
    cfg.campos.forEach(c => {
      const g = document.createElement('div');
      if (c.tipo === 'checkbox') {
        g.className = 'campo-grupo checkbox-grupo';
        g.innerHTML = `<input type="checkbox" ${item[c.nome] ? 'checked' : ''}>
                       <label>${c.rotulo}</label>`;
        g.querySelector('input').onchange = (e) => { item[c.nome] = e.target.checked; renderizarLista(chave); notificar(); };
      } else if (c.tipo === 'select') {
        g.className = 'campo-grupo';
        g.innerHTML = `<label class="campo-rotulo">${c.rotulo}</label>
          <select class="campo-select">
            <option value="">Selecione...</option>
            ${c.opcoes.map(o => `<option value="${o}" ${item[c.nome] === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>`;
        g.querySelector('select').onchange = (e) => { item[c.nome] = e.target.value; renderizarLista(chave); notificar(); };
      } else if (c.tipo === 'textarea') {
        g.className = 'campo-grupo';
        g.innerHTML = `<label class="campo-rotulo">${c.rotulo}</label>
          <textarea class="campo-textarea" rows="3">${Utils.escaparHtml(item[c.nome] || '')}</textarea>
          <div class="campo-contador">${(item[c.nome] || '').length} caracteres</div>`;
        const t = g.querySelector('textarea');
        t.oninput = (e) => {
          item[c.nome] = e.target.value;
          g.querySelector('.campo-contador').textContent = `${e.target.value.length} caracteres`;
          notificar();
        };
      } else {
        g.className = 'campo-grupo';
        g.innerHTML = `<label class="campo-rotulo">${c.rotulo}</label>
          <input type="${c.tipo}" class="campo-input" value="${Utils.escaparHtml(item[c.nome] || '')}">`;
        g.querySelector('input').oninput = (e) => {
          item[c.nome] = e.target.value;
          renderizarLista(chave);
          notificar();
        };
      }
      form.appendChild(g);
    });
    return form;
  }

  function popularFormulario() {
    const campos = ['nome','profissao','telefone','email','cidade','estado',
                    'linkedin','github','objetivo','informacoesAdicionais'];
    campos.forEach(c => {
      const el = document.getElementById(`campo-${c}`);
      if (el) { el.value = dados[c] || ''; atualizarContador(el); }
    });
    atualizarFotoPreview();
    Object.keys(configsListas).forEach(k => renderizarLista(k));
  }

  function limparTudo() {
    dados = criarVazio();
    popularFormulario();
    Storage.limparDados();
    notificar();
  }

  return { inicializar, obterDados, definirDados, onAlterar, adicionarItem, limparTudo, criarVazio };
})();

/* ============================
   PERSONALIZACAO — Configurações visuais
   ============================ */
const Personalizacao = (() => {
  const CORES = [
    { nome: 'Azul', valor: '#2563eb' },
    { nome: 'Verde', valor: '#059669' },
    { nome: 'Vinho', valor: '#9f1239' },
    { nome: 'Grafite', valor: '#374151' },
    { nome: 'Roxo', valor: '#7c3aed' },
    { nome: 'Laranja', valor: '#ea580c' },
  ];
  const FONTES = [
    { nome: 'Arial', valor: 'Arial, Helvetica, sans-serif' },
    { nome: 'Georgia', valor: 'Georgia, serif' },
    { nome: 'Times New Roman', valor: '"Times New Roman", Times, serif' },
    { nome: 'Calibri', valor: 'Calibri, sans-serif' },
    { nome: 'Helvetica', valor: 'Helvetica, Arial, sans-serif' },
  ];
  let cfg = {
    templateId: 'classico',
    corPrincipal: CORES[0].valor,
    fonte: FONTES[0].valor,
    tamanhoFonte: 10.5,
    mostrarFoto: true,
    ordemSecoes: Templates.SECOES_DISPONIVEIS.map(s => s.id),
  };
  let aoAlterar = null;

  function obter() { return JSON.parse(JSON.stringify(cfg)); }
  function definir(novo) {
    cfg = { ...cfg, ...novo };
    aplicar();
    if (aoAlterar) aoAlterar(obter());
  }
  function onAlterar(cb) { aoAlterar = cb; }

  function inicializar() {
    renderizarPaleta();
    renderizarFontes();
    renderizarTamanho();
    renderizarFoto();
    renderizarOrdem();
    renderizarModelos();
  }

  function aplicar() {
    const root = document.documentElement;
    root.style.setProperty('--cor-cv', cfg.corPrincipal);
    root.style.setProperty('--fonte-cv', cfg.fonte);
    root.style.setProperty('--tamanho-cv', cfg.tamanhoFonte + 'pt');
  }

  function renderizarPaleta() {
    const c = document.getElementById('cores-paleta');
    if (!c) return;
    c.innerHTML = '';
    CORES.forEach(cor => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `cor-opcao ${cfg.corPrincipal === cor.valor ? 'ativa' : ''}`;
      b.style.background = cor.valor;
      b.title = cor.nome;
      b.onclick = () => {
        cfg.corPrincipal = cor.valor;
        document.querySelectorAll('.cor-opcao').forEach(x => x.classList.remove('ativa'));
        b.classList.add('ativa');
        aplicar();
        if (aoAlterar) aoAlterar(obter());
      };
      c.appendChild(b);
    });
  }

  function renderizarFontes() {
    const sel = document.getElementById('selecao-fonte');
    if (!sel) return;
    sel.innerHTML = FONTES.map(f =>
      `<option value="${f.valor}" ${cfg.fonte === f.valor ? 'selected' : ''}>${f.nome}</option>`
    ).join('');
    sel.onchange = () => {
      cfg.fonte = sel.value;
      aplicar();
      if (aoAlterar) aoAlterar(obter());
    };
  }

  function renderizarTamanho() {
    const inp = document.getElementById('tamanho-fonte');
    const lbl = document.getElementById('tamanho-fonte-valor');
    if (!inp) return;
    inp.value = cfg.tamanhoFonte;
    if (lbl) lbl.textContent = cfg.tamanhoFonte + 'pt';
    inp.oninput = () => {
      cfg.tamanhoFonte = parseFloat(inp.value);
      if (lbl) lbl.textContent = cfg.tamanhoFonte + 'pt';
      aplicar();
      if (aoAlterar) aoAlterar(obter());
    };
  }

  function renderizarFoto() {
    const chk = document.getElementById('chk-mostrar-foto');
    if (!chk) return;
    chk.checked = cfg.mostrarFoto;
    chk.onchange = () => {
      cfg.mostrarFoto = chk.checked;
      if (aoAlterar) aoAlterar(obter());
    };
  }

  function renderizarOrdem() {
    const container = document.getElementById('ordem-secoes');
    if (!container) return;
    container.innerHTML = '';
    cfg.ordemSecoes.forEach((id, idx) => {
      const info = Templates.SECOES_DISPONIVEIS.find(s => s.id === id);
      if (!info) return;
      const el = document.createElement('div');
      el.className = 'ordem-item';
      el.innerHTML = `
        <span class="ordem-item-nome">${info.nome}</span>
        <button type="button" class="ordem-item-btn" data-direcao="up" ${idx === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="ordem-item-btn" data-direcao="down" ${idx === cfg.ordemSecoes.length - 1 ? 'disabled' : ''}>↓</button>`;
      el.querySelectorAll('.ordem-item-btn').forEach(b => {
        b.onclick = () => moverSecao(idx, b.dataset.direcao);
      });
      container.appendChild(el);
    });
  }

  function moverSecao(idx, direcao) {
    const novo = [...cfg.ordemSecoes];
    const alvo = direcao === 'up' ? idx - 1 : idx + 1;
    if (alvo < 0 || alvo >= novo.length) return;
    [novo[idx], novo[alvo]] = [novo[alvo], novo[idx]];
    cfg.ordemSecoes = novo;
    renderizarOrdem();
    if (aoAlterar) aoAlterar(obter());
  }

  function renderizarModelos() {
    const btn = document.getElementById('btn-trocar-modelo');
    if (btn) btn.onclick = abrirModalModelos;
  }

  async function abrirModalModelos() {
    const cards = Templates.MODELOS.map(m => `
      <div class="template-card ${cfg.templateId === m.id ? 'ativo' : ''}" data-id="${m.id}">
        <div class="template-card-mini">
          <div class="mini-titulo">${m.nome}</div>
          <div class="mini-linha"></div>
          <div class="mini-linha" style="width:70%;"></div>
          <div class="mini-linha"></div>
        </div>
        <div class="template-card-nome">${m.nome}</div>
      </div>`).join('');
    const fundo = document.createElement('div');
    fundo.className = 'modal-fundo';
    fundo.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-titulo">Escolha um modelo</div>
        <div class="grade-templates">${cards}</div>
        <div class="modal-acoes">
          <button class="btn btn-secundario" id="fechar">Fechar</button>
        </div>
      </div>`;
    document.body.appendChild(fundo);
    fundo.querySelectorAll('.template-card').forEach(c => {
      c.onclick = () => {
        cfg.templateId = c.dataset.id;
        fundo.querySelectorAll('.template-card').forEach(x => x.classList.remove('ativo'));
        c.classList.add('ativo');
        if (aoAlterar) aoAlterar(obter());
        Utils.mostrarToast(`Modelo "${Templates.MODELOS.find(m => m.id === cfg.templateId).nome}" aplicado`, 'sucesso');
      };
    });
    fundo.querySelector('#fechar').onclick = () => fundo.remove();
    fundo.onclick = (e) => { if (e.target === fundo) fundo.remove(); };
  }

  return { inicializar, obter, definir, onAlterar };
})();

/* ============================
   EXPORTACAO — Imprimir, JSON
   ============================ */
const Exportacao = (() => {
  function inicializar() {
    const btnPrint = document.getElementById('btn-imprimir');
    const btnExpJ = document.getElementById('btn-exportar-json');
    const btnImpJ = document.getElementById('btn-importar-json');
    const input = document.getElementById('input-importar-json');
    if (btnPrint) btnPrint.onclick = imprimir;
    if (btnExpJ) btnExpJ.onclick = exportarJson;
    if (btnImpJ) btnImpJ.onclick = () => input.click();
    if (input) input.onchange = importarJson;
  }

  function imprimir() {
    Utils.mostrarToast('Abrindo diálogo de impressão... Selecione "Salvar como PDF" se preferir.', 'info');
    setTimeout(() => window.print(), 300);
  }

  function exportarJson() {
    const dados = Editor.obterDados();
    const config = Personalizacao.obter();
    const pacote = { dados, config };
    const nome = `Curriculo-${Utils.nomeArquivoSeguro(dados.nome || 'dados')}.json`;
    Utils.baixarArquivo(JSON.stringify(pacote, null, 2), nome, 'application/json');
    Utils.mostrarToast('JSON exportado!', 'sucesso');
  }

  function importarJson(ev) {
    const arq = ev.target.files[0];
    if (!arq) return;
    const leitor = new FileReader();
    leitor.onload = (e) => {
      try {
        const pacote = JSON.parse(e.target.result);
        if (pacote.dados) Editor.definirDados(pacote.dados);
        if (pacote.config) Personalizacao.definir(pacote.config);
        Utils.mostrarToast('Currículo importado!', 'sucesso');
      } catch (err) {
        Utils.mostrarToast('Arquivo JSON inválido', 'perigo');
      }
    };
    leitor.readAsText(arq);
    ev.target.value = '';
  }

  return { inicializar, imprimir, exportarJson };
})();

/* ============================
   APP — Orquestração principal
   ============================ */
const App = (() => {
  let timerAutoSave = null;

  function inicializar() {
    carregarConfig();
    Preview.inicializar();
    Editor.inicializar();
    Personalizacao.inicializar();
    Exportacao.inicializar();

    Editor.onAlterar(debounceAtualizar);
    Personalizacao.onAlterar(debounceAtualizarConfig);

    configurarCabecalho();
    Preview.ajustarZoomAutomatico();

    Preview.atualizar(Editor.obterDados(), Personalizacao.obter());

    window.addEventListener('resize', Utils.debounce(() => {
      Preview.ajustarZoomAutomatico();
    }, 200));

    verificarDadosSalvos();
  }

  const debounceAtualizar = Utils.debounce((dados) => {
    Preview.atualizar(dados, Personalizacao.obter());
    salvarAuto();
  }, 150);

  const debounceAtualizarConfig = Utils.debounce((cfg) => {
    Preview.atualizar(Editor.obterDados(), cfg);
    salvarAuto();
  }, 150);

  function salvarAuto() {
    clearTimeout(timerAutoSave);
    timerAutoSave = setTimeout(() => {
      Storage.salvarDados(Editor.obterDados());
      // Preserva tema existente ao salvar personalização
      const atual = Storage.carregarConfig() || {};
      Storage.salvarConfig({ ...atual, ...Personalizacao.obter() });
      atualizarStatusSalvo();
    }, 600);
  }

  function atualizarStatusSalvo() {
    const el = document.getElementById('status-salvo');
    if (!el) return;
    el.textContent = '✓ Salvo automaticamente';
    el.classList.add('ativo');
    setTimeout(() => el.classList.remove('ativo'), 2000);
  }

  function carregarConfig() {
    const cfgStorage = Storage.carregarConfig();
    if (!cfgStorage) return;
    // Separa dados de personalização do tema
    const { tema, ...personalizacao } = cfgStorage;
    if (Object.keys(personalizacao).length) Personalizacao.definir(personalizacao);
    if (tema === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  }

  async function verificarDadosSalvos() {
    if (!Storage.existeDados()) return;
    const r = await Utils.mostrarModal(
      'Continuar editando?',
      '<p style="color: var(--cor-texto-suave);">Encontramos um currículo salvo. Deseja continuar de onde parou?</p>',
      [
        { texto: 'Começar do zero', classe: 'btn-secundario', valor: 'novo' },
        { texto: 'Continuar', classe: 'btn-primario', valor: 'continuar' },
      ]
    );
    if (r === 'continuar') {
      const d = Storage.carregarDados();
      if (d) Editor.definirDados(d);
    } else if (r === 'novo') {
      Storage.limparDados();
    }
  }

  function configurarCabecalho() {
    document.getElementById('btn-novo')?.addEventListener('click', novoCurriculo);
    document.getElementById('btn-salvar')?.addEventListener('click', salvarManual);
    document.getElementById('btn-limpar')?.addEventListener('click', limparTudo);
    document.getElementById('btn-tema')?.addEventListener('click', alternarTema);
    document.getElementById('zoom-menos')?.addEventListener('click', () => Preview.definirZoom(Preview.obterZoom() - 0.1));
    document.getElementById('zoom-mais')?.addEventListener('click', () => Preview.definirZoom(Preview.obterZoom() + 0.1));
  }

  async function novoCurriculo() {
    const r = await Utils.mostrarModal(
      'Novo currículo',
      '<p style="color: var(--cor-texto-suave);">Iniciar um novo currículo? Recomendamos exportar o atual antes.</p>',
      [
        { texto: 'Cancelar', classe: 'btn-secundario', valor: 'cancelar' },
        { texto: 'Novo currículo', classe: 'btn-primario', valor: 'novo' },
      ]
    );
    if (r === 'novo') {
      Editor.limparTudo();
      Utils.mostrarToast('Novo currículo iniciado', 'sucesso');
    }
  }

  function salvarManual() {
    Storage.salvarDados(Editor.obterDados());
    const atual = Storage.carregarConfig() || {};
    Storage.salvarConfig({ ...atual, ...Personalizacao.obter() });
    Utils.mostrarToast('Currículo salvo!', 'sucesso');
    atualizarStatusSalvo();
  }

  async function limparTudo() {
    const r = await Utils.mostrarModal(
      'Limpar tudo?',
      '<p style="color: var(--cor-perigo);">Esta ação apaga todos os dados. Não pode ser desfeita.</p>',
      [
        { texto: 'Cancelar', classe: 'btn-secundario', valor: 'cancelar' },
        { texto: 'Sim, limpar', classe: 'btn-perigo', valor: 'limpar' },
      ]
    );
    if (r === 'limpar') {
      Editor.limparTudo();
      Utils.mostrarToast('Dados apagados', 'alerta');
    }
  }

  function alternarTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novo = atual === 'dark' ? 'light' : 'dark';
    if (novo === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    const cfgAtual = Storage.carregarConfig() || {};
    Storage.salvarConfig({ ...cfgAtual, tema: novo });
  }

  document.addEventListener('DOMContentLoaded', inicializar);

  return { inicializar };
})();
