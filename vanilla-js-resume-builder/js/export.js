/* ============================================
   EXPORT.JS — Exportar PDF, importar/exportar JSON
   ============================================ */

const Exportacao = (() => {
  function inicializar() {
    const btnPdf = document.getElementById('btn-exportar-pdf');
    const btnSalvarJson = document.getElementById('btn-exportar-json');
    const btnImportarJson = document.getElementById('btn-importar-json');
    const inputImportar = document.getElementById('input-importar-json');

    if (btnPdf) btnPdf.addEventListener('click', exportarPdf);
    if (btnSalvarJson) btnSalvarJson.addEventListener('click', exportarJson);
    if (btnImportarJson) btnImportarJson.addEventListener('click', () => inputImportar.click());
    if (inputImportar) inputImportar.addEventListener('change', importarJson);
  }

  function exportarPdf() {
    const folha = Preview.obterElementoFolha();
    if (!folha) return;

    const nomeCurriculo = Editor.obterDados().nome || 'Curriculo';
    const nomeArquivo = `Curriculo-${Utils.nomeArquivoSeguro(nomeCurriculo)}.pdf`;

    Utils.mostrarToast('Gerando PDF... aguarde.', 'info');

    if (typeof html2pdf === 'undefined') {
      Utils.mostrarToast('Biblioteca de PDF não carregada. Verifique sua conexão.', 'perigo');
      return;
    }

    const opcoes = {
      margin: 0,
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: folha.scrollWidth,
        windowHeight: folha.scrollHeight,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    html2pdf().set(opcoes).from(folha).save()
      .then(() => Utils.mostrarToast('PDF exportado com sucesso!', 'sucesso'))
      .catch(() => Utils.mostrarToast('Erro ao gerar PDF.', 'perigo'));
  }

  function exportarJson() {
    const dados = Editor.obterDados();
    const nomeArquivo = `Curriculo-${Utils.nomeArquivoSeguro(dados.nome || 'dados')}.json`;
    Utils.baixarArquivo(JSON.stringify(dados, null, 2), nomeArquivo, 'application/json');
    Utils.mostrarToast('JSON exportado', 'sucesso');
  }

  function importarJson(evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = (e) => {
      try {
        const dados = JSON.parse(e.target.result);
        Editor.definirDados(dados);
        Utils.mostrarToast('Currículo importado!', 'sucesso');
      } catch (err) {
        Utils.mostrarToast('Arquivo JSON inválido', 'perigo');
      }
    };
    leitor.readAsText(arquivo);
    evento.target.value = '';
  }

  return { inicializar, exportarPdf, exportarJson };
})();
