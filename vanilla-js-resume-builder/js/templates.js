/* ============================================
   TEMPLATES.JS — Definição dos modelos de currículo
   ============================================ */

const Templates = (() => {
  const esc = Utils.escaparHtml;
  const fmtData = Utils.formatarData;

  function renderizarContatos(d) {
    const itens = [];
    if (d.telefone) itens.push(esc(d.telefone));
    if (d.whatsapp && d.whatsapp !== d.telefone) itens.push(`WhatsApp: ${esc(d.whatsapp)}`);
    if (d.email) itens.push(esc(d.email));
    if (d.cidade && d.estado) itens.push(`${esc(d.cidade)}/${esc(d.estado)}`);
    if (d.linkedin) itens.push(`<a class="cv-link" href="${esc(d.linkedin)}" target="_blank">LinkedIn</a>`);
    if (d.github) itens.push(`<a class="cv-link" href="${esc(d.github)}" target="_blank">GitHub</a>`);
    if (d.portfolio) itens.push(`<a class="cv-link" href="${esc(d.portfolio)}" target="_blank">Portfólio</a>`);
    return itens.length ? `<div class="cv-contatos">${itens.join(' • ')}</div>` : '';
  }

  function renderizarFoto(d) {
    if (!d.foto) return '';
    return `<img class="cv-foto" src="${esc(d.foto)}" alt="Foto">`;
  }

  function renderizarCabecalho(d, comFotoInline = false) {
    const nomeHtml = `<div class="cv-nome">${esc(d.nome) || 'Seu Nome'}</div>`;
    const profHtml = d.profissao ? `<div class="cv-profissao">${esc(d.profissao)}</div>` : '';
    const contatosHtml = renderizarContatos(d);
    const fotoHtml = renderizarFoto(d);

    if (comFotoInline && fotoHtml) {
      return `
        <div class="cv-cabecalho cv-cabecalho-com-foto">
          ${fotoHtml}
          <div>
            ${nomeHtml}
            ${profHtml}
            ${contatosHtml}
          </div>
        </div>`;
    }
    return `
      <div class="cv-cabecalho">
        ${fotoHtml}
        ${nomeHtml}
        ${profHtml}
        ${contatosHtml}
      </div>`;
  }

  function renderizarSecaoTexto(titulo, texto) {
    if (!texto) return '';
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">${esc(titulo)}</div>
        <div class="cv-secao-texto">${esc(texto)}</div>
      </div>`;
  }

  function renderizarExperiencias(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(e => {
      const periodo = e.atual
        ? `${fmtData(e.inicio)} – o momento`
        : `${fmtData(e.inicio)}${e.fim ? ' – ' + fmtData(e.fim) : ''}`;
      return `
        <div class="cv-item">
          <div class="cv-item-cabecalho">
            <div class="cv-item-titulo">${esc(e.cargo) || ''}</div>
            <div class="cv-item-periodo">${esc(periodo)}</div>
          </div>
          <div class="cv-item-subtitulo">
            ${esc(e.empresa)}${e.cidade ? ' • ' + esc(e.cidade) : ''}
          </div>
          ${e.descricao ? `<div class="cv-item-descricao">${esc(e.descricao)}</div>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">Experiência Profissional</div>
        ${itens}
      </div>`;
  }

  function renderizarEscolaridade(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(e => {
      const periodo = `${fmtData(e.inicio)}${e.fim ? ' – ' + fmtData(e.fim) : ''}`;
      return `
        <div class="cv-item">
          <div class="cv-item-cabecalho">
            <div class="cv-item-titulo">${esc(e.curso) || ''}</div>
            <div class="cv-item-periodo">${esc(periodo)}</div>
          </div>
          <div class="cv-item-subtitulo">${esc(e.instituicao)}</div>
          ${e.descricao ? `<div class="cv-item-descricao">${esc(e.descricao)}</div>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">Formação Acadêmica</div>
        ${itens}
      </div>`;
  }

  function renderizarCursos(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(c => `
      <div class="cv-item">
        <div class="cv-item-cabecalho">
          <div class="cv-item-titulo">${esc(c.nome)}</div>
          <div class="cv-item-periodo">${esc(c.ano)}${c.cargaHoraria ? ' • ' + esc(c.cargaHoraria) + 'h' : ''}</div>
        </div>
        <div class="cv-item-subtitulo">${esc(c.instituicao)}</div>
      </div>`).join('');
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">Cursos Complementares</div>
        ${itens}
      </div>`;
  }

  function renderizarHabilidades(lista) {
    if (!lista || !lista.length) return '';
    const tags = lista.map(h => `<span class="cv-habilidade-tag">${esc(h)}</span>`).join('');
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">Habilidades</div>
        <div class="cv-habilidades">${tags}</div>
      </div>`;
  }

  function renderizarIdiomas(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(i => `
      <span class="cv-idioma"><strong>${esc(i.idioma)}</strong> – ${esc(i.nivel)}</span>
    `).join(' • ');
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">Idiomas</div>
        <div class="cv-idiomas-lista">${itens}</div>
      </div>`;
  }

  function renderizarProjetos(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(p => `
      <div class="cv-item">
        <div class="cv-item-cabecalho">
          <div class="cv-item-titulo">${esc(p.nome)}</div>
          ${p.link ? `<div><a class="cv-link" href="${esc(p.link)}" target="_blank">Ver projeto</a></div>` : ''}
        </div>
        ${p.tecnologias ? `<div class="cv-item-subtitulo">${esc(p.tecnologias)}</div>` : ''}
        ${p.descricao ? `<div class="cv-item-descricao">${esc(p.descricao)}</div>` : ''}
      </div>`).join('');
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">Projetos</div>
        ${itens}
      </div>`;
  }

  function renderizarCertificacoes(lista) {
    if (!lista || !lista.length) return '';
    const itens = lista.map(c => `
      <div class="cv-item">
        <div class="cv-item-cabecalho">
          <div class="cv-item-titulo">${esc(c.nome)}</div>
          <div class="cv-item-periodo">${esc(c.ano)}</div>
        </div>
        <div class="cv-item-subtitulo">${esc(c.instituicao)}</div>
      </div>`).join('');
    return `
      <div class="cv-secao">
        <div class="cv-secao-titulo">Certificações</div>
        ${itens}
      </div>`;
  }

  /* ---------- Função principal por template ---------- */
  function gerarHtml(templateId, dados) {
    const corpo = `
      ${renderizarSecaoTexto('Objetivo', dados.objetivo)}
      ${renderizarSecaoTexto('Resumo Profissional', dados.resumo)}
      ${renderizarSecaoTexto('Qualificações', dados.qualificacoes)}
      ${renderizarExperiencias(dados.experiencias)}
      ${renderizarEscolaridade(dados.escolaridade)}
      ${renderizarCursos(dados.cursos)}
      ${renderizarCertificacoes(dados.certificacoes)}
      ${renderizarProjetos(dados.projetos)}
      ${renderizarHabilidades(dados.habilidades)}
      ${renderizarIdiomas(dados.idiomas)}
      ${renderizarSecaoTexto('Informações Adicionais', dados.informacoesAdicionais)}
    `;

    const classeTemplate = `template-${templateId}`;
    return `<div class="${classeTemplate}">
      ${renderizarCabecalho(dados, templateId === 'moderno' || templateId === 'minimalista')}
      ${corpo}
    </div>`;
  }

  const lista = [
    { id: 'tradicional',  nome: 'Tradicional'  },
    { id: 'minimalista',  nome: 'Minimalista'  },
    { id: 'corporativo',  nome: 'Corporativo'  },
    { id: 'moderno',      nome: 'Moderno'      },
    { id: 'ats',          nome: 'ATS'          },
  ];

  return { gerarHtml, lista };
})();
