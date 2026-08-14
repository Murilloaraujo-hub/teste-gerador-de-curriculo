/* ============================================
   EDITOR.JS — Gerencia o formulário de edição
   ============================================ */

const Editor = (() => {
  let dados = criarCurriculoVazio();
  let aoAlterarCallback = null;

  function criarCurriculoVazio() {
    return {
      nome: '', profissao: '', dataNascimento: '', estadoCivil: '', nacionalidade: '',
      telefone: '', whatsapp: '', email: '', linkedin: '', github: '', portfolio: '',
      cidade: '', estado: '', cep: '', endereco: '', foto: '',
      objetivo: '', resumo: '', qualificacoes: '',
      experiencias: [], escolaridade: [], cursos: [],
      idiomas: [], habilidades: [], projetos: [],
      certificacoes: [], informacoesAdicionais: '',
    };
  }

  function obterDados() { return JSON.parse(JSON.stringify(dados)); }

  function definirDados(novos) {
    dados = { ...criarCurriculoVazio(), ...novos };
    popularFormulario();
    notificarAlteracao();
  }

  function aoAlterar(callback) { aoAlterarCallback = callback; }

  function notificarAlteracao() {
    if (aoAlterarCallback) aoAlterarCallback(obterDados());
  }

  function inicializar() {
    vincularCamposPessoais();
    vincularCamposTexto();
    inicializarSecoesColapsaveis();
    configurarUploadFoto();
    vincularBotoesListas();
  }

  function vincularCamposPessoais() {
    const campos = ['nome', 'profissao', 'dataNascimento', 'estadoCivil', 'nacionalidade',
                    'telefone', 'whatsapp', 'email', 'linkedin', 'github', 'portfolio',
                    'cidade', 'estado', 'cep', 'endereco'];
    campos.forEach(campo => {
      const el = document.getElementById(`campo-${campo}`);
      if (!el) return;
      el.addEventListener('input', () => {
        dados[campo] = el.value;
        validarCampo(el, campo);
        atualizarContador(el);
        notificarAlteracao();
      });
    });
  }

  function vincularCamposTexto() {
    const campos = ['objetivo', 'resumo', 'qualificacoes', 'informacoesAdicionais'];
    campos.forEach(campo => {
      const el = document.getElementById(`campo-${campo}`);
      if (!el) return;
      el.addEventListener('input', () => {
        dados[campo] = el.value;
        atualizarContador(el);
        notificarAlteracao();
      });
    });
  }

  function validarCampo(el, campo) {
    let valido = true;
    if (campo === 'email' && el.value) valido = Utils.validarEmail(el.value);
    if ((campo === 'telefone' || campo === 'whatsapp') && el.value) valido = Utils.validarTelefone(el.value);
    el.classList.toggle('campo-erro', !valido);
    return valido;
  }

  function atualizarContador(el) {
    const contador = el.parentElement.querySelector('.campo-contador');
    if (contador) contador.textContent = `${el.value.length} caracteres`;
  }

  function configurarUploadFoto() {
    const preview = document.getElementById('foto-preview');
    const input = document.getElementById('campo-foto');
    const btnRemover = document.getElementById('btn-remover-foto');
    if (!preview || !input) return;

    preview.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
      const arquivo = e.target.files[0];
      if (!arquivo) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        dados.foto = ev.target.result;
        atualizarPreviewFoto();
        notificarAlteracao();
      };
      reader.readAsDataURL(arquivo);
    });
    if (btnRemover) btnRemover.addEventListener('click', () => {
      dados.foto = '';
      input.value = '';
      atualizarPreviewFoto();
      notificarAlteracao();
    });
  }

  function atualizarPreviewFoto() {
    const preview = document.getElementById('foto-preview');
    if (!preview) return;
    if (dados.foto) {
      preview.innerHTML = `<img src="${dados.foto}" alt="Foto">`;
    } else {
      preview.innerHTML = '📷';
    }
  }

  function inicializarSecoesColapsaveis() {
    document.querySelectorAll('.editor-secao-cabecalho').forEach(cab => {
      cab.addEventListener('click', (e) => {
        if (e.target.closest('.btn')) return;
        cab.closest('.editor-secao').classList.toggle('colapsada');
      });
    });
  }

  /* ---------- Listas dinâmicas ---------- */
  const configuracoesListas = {
    experiencias: {
      titulo: 'Experiências',
      containerId: 'lista-experiencias',
      campoPrincipal: 'cargo',
      campoSub: 'empresa',
      campos: [
        { nome: 'empresa', rotulo: 'Empresa', tipo: 'text' },
        { nome: 'cargo', rotulo: 'Cargo', tipo: 'text' },
        { nome: 'cidade', rotulo: 'Cidade', tipo: 'text' },
        { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
        { nome: 'fim', rotulo: 'Fim', tipo: 'month' },
        { nome: 'atual', rotulo: 'Emprego atual', tipo: 'checkbox' },
        { nome: 'descricao', rotulo: 'Descrição das atividades', tipo: 'textarea' },
      ],
    },
    escolaridade: {
      titulo: 'Formações',
      containerId: 'lista-escolaridade',
      campoPrincipal: 'curso',
      campoSub: 'instituicao',
      campos: [
        { nome: 'instituicao', rotulo: 'Instituição', tipo: 'text' },
        { nome: 'curso', rotulo: 'Curso', tipo: 'text' },
        { nome: 'inicio', rotulo: 'Início', tipo: 'month' },
        { nome: 'fim', rotulo: 'Fim', tipo: 'month' },
        { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
      ],
    },
    cursos: {
      titulo: 'Cursos',
      containerId: 'lista-cursos',
      campoPrincipal: 'nome',
      campoSub: 'instituicao',
      campos: [
        { nome: 'nome', rotulo: 'Nome do Curso', tipo: 'text' },
        { nome: 'instituicao', rotulo: 'Instituição', tipo: 'text' },
        { nome: 'cargaHoraria', rotulo: 'Carga Horária', tipo: 'number' },
        { nome: 'ano', rotulo: 'Ano', tipo: 'number' },
        { nome: 'certificado', rotulo: 'URL Certificado', tipo: 'text' },
      ],
    },
    idiomas: {
      titulo: 'Idiomas',
      containerId: 'lista-idiomas',
      campoPrincipal: 'idioma',
      campoSub: 'nivel',
      campos: [
        { nome: 'idioma', rotulo: 'Idioma', tipo: 'text' },
        { nome: 'nivel', rotulo: 'Nível', tipo: 'select',
          opcoes: ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'] },
      ],
    },
    habilidades: {
      titulo: 'Habilidades',
      containerId: 'lista-habilidades',
      campoPrincipal: 'nome',
      campos: [
        { nome: 'nome', rotulo: 'Nome da Habilidade', tipo: 'text' },
      ],
      modoTag: true,
    },
    projetos: {
      titulo: 'Projetos',
      containerId: 'lista-projetos',
      campoPrincipal: 'nome',
      campoSub: 'tecnologias',
      campos: [
        { nome: 'nome', rotulo: 'Nome do Projeto', tipo: 'text' },
        { nome: 'tecnologias', rotulo: 'Tecnologias', tipo: 'text' },
        { nome: 'link', rotulo: 'Link', tipo: 'text' },
        { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
      ],
    },
    certificacoes: {
      titulo: 'Certificações',
      containerId: 'lista-certificacoes',
      campoPrincipal: 'nome',
      campoSub: 'instituicao',
      campos: [
        { nome: 'nome', rotulo: 'Nome', tipo: 'text' },
        { nome: 'instituicao', rotulo: 'Instituição', tipo: 'text' },
        { nome: 'ano', rotulo: 'Ano', tipo: 'number' },
      ],
    },
  };

  function vincularBotoesListas() {
    Object.keys(configuracoesListas).forEach(chave => {
      const btnAdicionar = document.getElementById(`btn-add-${chave}`);
      if (btnAdicionar) {
        btnAdicionar.addEventListener('click', () => adicionarItem(chave));
      }
      renderizarLista(chave);
    });
  }

  function adicionarItem(chave, itemExistente = null, expandirAutomaticamente = true) {
    const item = itemExistente || { id: Utils.gerarId() };
    if (!dados[chave]) dados[chave] = [];
    dados[chave].push(item);
    renderizarLista(chave);
    if (expandirAutomaticamente && !itemExistente) {
      const config = configuracoesListas[chave];
      if (!config.modoTag) {
        const container = document.getElementById(config.containerId);
        const ultimoItem = container?.lastElementChild;
        if (ultimoItem) {
          ultimoItem.classList.add('expandido');
          setTimeout(() => ultimoItem.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
      }
    }
    notificarAlteracao();
  }

  function removerItem(chave, id) {
    dados[chave] = dados[chave].filter(i => i.id !== id);
    renderizarLista(chave);
    notificarAlteracao();
  }

  function duplicarItem(chave, id) {
    const original = dados[chave].find(i => i.id === id);
    if (!original) return;
    const copia = { ...JSON.parse(JSON.stringify(original)), id: Utils.gerarId() };
    dados[chave].push(copia);
    renderizarLista(chave);
    notificarAlteracao();
    Utils.mostrarToast('Item duplicado', 'sucesso');
  }

  function renderizarLista(chave) {
    const config = configuracoesListas[chave];
    const container = document.getElementById(config.containerId);
    if (!container) return;
    container.innerHTML = '';

    if (config.modoTag) {
      renderizarListaTags(chave, config, container);
      return;
    }

    dados[chave].forEach(item => {
      container.appendChild(criarElementoItem(chave, config, item));
    });
  }

  function renderizarListaTags(chave, config, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tags-container';
    dados[chave].forEach(item => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.innerHTML = `${Utils.escaparHtml(item.nome || '')} <span class="tag-remover" title="Remover">×</span>`;
      tag.querySelector('.tag-remover').onclick = () => removerItem(chave, item.id);
      wrapper.appendChild(tag);
    });
    container.appendChild(wrapper);
  }

  function criarElementoItem(chave, config, item) {
    const el = document.createElement('div');
    el.className = 'lista-item animacao-aparecer';
    const titulo = item[config.campoPrincipal] || `Novo ${config.titulo.slice(0, -1)}`;
    const sub = config.campoSub && item[config.campoSub] ? ` — ${Utils.escaparHtml(item[config.campoSub])}` : '';

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
      <div class="lista-item-conteudo"></div>
    `;

    const corpo = el.querySelector('.lista-item-conteudo');
    corpo.appendChild(criarFormularioItem(chave, config, item));

    el.querySelector('[data-acao="editar"]').onclick = (e) => {
      e.stopPropagation();
      el.classList.toggle('expandido');
    };
    el.querySelector('[data-acao="duplicar"]').onclick = (e) => {
      e.stopPropagation();
      duplicarItem(chave, item.id);
    };
    el.querySelector('[data-acao="excluir"]').onclick = (e) => {
      e.stopPropagation();
      removerItem(chave, item.id);
    };

    return el;
  }

  function criarFormularioItem(chave, config, item) {
    const form = document.createElement('div');
    config.campos.forEach(campo => {
      const grupo = document.createElement('div');
      grupo.className = 'campo-grupo';

      if (campo.tipo === 'checkbox') {
        grupo.className = 'checkbox-grupo';
        grupo.innerHTML = `
          <input type="checkbox" id="${chave}-${item.id}-${campo.nome}"
            ${item[campo.nome] ? 'checked' : ''}>
          <label for="${chave}-${item.id}-${campo.nome}">${campo.rotulo}</label>
        `;
        grupo.querySelector('input').addEventListener('change', (e) => {
          item[campo.nome] = e.target.checked;
          atualizarTituloItem(chave, config, item);
          notificarAlteracao();
        });
      } else if (campo.tipo === 'select') {
        grupo.innerHTML = `
          <label class="campo-rotulo">${campo.rotulo}</label>
          <select class="campo-select">
            <option value="">Selecione...</option>
            ${campo.opcoes.map(o => `<option value="${o}" ${item[campo.nome] === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        `;
        grupo.querySelector('select').addEventListener('change', (e) => {
          item[campo.nome] = e.target.value;
          atualizarTituloItem(chave, config, item);
          notificarAlteracao();
        });
      } else if (campo.tipo === 'textarea') {
        grupo.innerHTML = `
          <label class="campo-rotulo">${campo.rotulo}</label>
          <textarea class="campo-textarea" rows="3">${Utils.escaparHtml(item[campo.nome] || '')}</textarea>
          <div class="campo-contador">${(item[campo.nome] || '').length} caracteres</div>
        `;
        const textarea = grupo.querySelector('textarea');
        textarea.addEventListener('input', (e) => {
          item[campo.nome] = e.target.value;
          grupo.querySelector('.campo-contador').textContent = `${e.target.value.length} caracteres`;
          notificarAlteracao();
        });
      } else {
        grupo.innerHTML = `
          <label class="campo-rotulo">${campo.rotulo}</label>
          <input type="${campo.tipo}" class="campo-input" value="${Utils.escaparHtml(item[campo.nome] || '')}">
        `;
        grupo.querySelector('input').addEventListener('input', (e) => {
          item[campo.nome] = e.target.value;
          atualizarTituloItem(chave, config, item);
          notificarAlteracao();
        });
      }
      form.appendChild(grupo);
    });
    return form;
  }

  function atualizarTituloItem(chave, config, item) {
    renderizarLista(chave);
  }

  function popularFormulario() {
    const campos = ['nome', 'profissao', 'dataNascimento', 'estadoCivil', 'nacionalidade',
                    'telefone', 'whatsapp', 'email', 'linkedin', 'github', 'portfolio',
                    'cidade', 'estado', 'cep', 'endereco',
                    'objetivo', 'resumo', 'qualificacoes', 'informacoesAdicionais'];
    campos.forEach(campo => {
      const el = document.getElementById(`campo-${campo}`);
      if (el) {
        el.value = dados[campo] || '';
        atualizarContador(el);
      }
    });
    atualizarPreviewFoto();
    Object.keys(configuracoesListas).forEach(chave => renderizarLista(chave));
  }

  function limparTudo() {
    dados = criarCurriculoVazio();
    popularFormulario();
    Storage.limparCurriculo();
    notificarAlteracao();
  }

  return {
    inicializar,
    obterDados,
    definirDados,
    aoAlterar,
    adicionarItem,
    limparTudo,
    criarCurriculoVazio,
  };
})();
