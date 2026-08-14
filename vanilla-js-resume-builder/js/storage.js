/* ============================================
   STORAGE.JS — Persistência em LocalStorage
   ============================================ */

const Storage = (() => {
  const CHAVE_CURRICULO = 'curriculo_maker_dados';
  const CHAVE_CONFIG = 'curriculo_maker_config';
  const CHAVE_ULTIMO_TEMPLATE = 'curriculo_maker_template';

  function salvarCurriculo(dados) {
    try {
      localStorage.setItem(CHAVE_CURRICULO, JSON.stringify(dados));
      return true;
    } catch (e) {
      console.error('Erro ao salvar:', e);
      return false;
    }
  }

  function carregarCurriculo() {
    try {
      const dados = localStorage.getItem(CHAVE_CURRICULO);
      return dados ? JSON.parse(dados) : null;
    } catch (e) {
      console.error('Erro ao carregar:', e);
      return null;
    }
  }

  function limparCurriculo() {
    localStorage.removeItem(CHAVE_CURRICULO);
  }

  function salvarConfiguracao(config) {
    try {
      localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
      return true;
    } catch (e) { return false; }
  }

  function carregarConfiguracao() {
    try {
      const dados = localStorage.getItem(CHAVE_CONFIG);
      return dados ? JSON.parse(dados) : {};
    } catch (e) { return {}; }
  }

  function salvarTemplate(templateId) {
    localStorage.setItem(CHAVE_ULTIMO_TEMPLATE, templateId);
  }

  function carregarTemplate() {
    return localStorage.getItem(CHAVE_ULTIMO_TEMPLATE) || 'tradicional';
  }

  function existeCurriculoSalvo() {
    return !!localStorage.getItem(CHAVE_CURRICULO);
  }

  return {
    salvarCurriculo,
    carregarCurriculo,
    limparCurriculo,
    salvarConfiguracao,
    carregarConfiguracao,
    salvarTemplate,
    carregarTemplate,
    existeCurriculoSalvo,
  };
})();
