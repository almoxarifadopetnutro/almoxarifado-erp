import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';
import { Material, Movimentacao } from '../types';

type Aba = 'movimentacoes' | 'consumo' | 'produto' | 'baixo' | 'estoque';

const NAVY: [number, number, number] = [15, 42, 74];
const NAVY_SUBTLE: [number, number, number] = [157, 180, 209];
const BORDA_CLARA: [number, number, number] = [227, 231, 236];
const LINHA_ALT: [number, number, number] = [247, 249, 251];
const VERMELHO_BG: [number, number, number] = [252, 235, 235];
const VERMELHO_TX: [number, number, number] = [163, 45, 45];
const AMBAR_BG: [number, number, number] = [250, 238, 218];
const AMBAR_TX: [number, number, number] = [133, 79, 11];
const VERDE_BG: [number, number, number] = [234, 243, 222];
const VERDE_TX: [number, number, number] = [59, 109, 17];

function exportarCSV(nomeArquivo: string, linhas: string[][]) {
  const conteudo = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

function statusEstoque(atual: number, minimo: number) {
  if (atual < minimo) return { label: 'Baixo', bg: '#FCEBEB', tx: '#A32D2D', pdfBg: VERMELHO_BG, pdfTx: VERMELHO_TX };
  if (atual === minimo) return { label: 'No limite', bg: '#FAEEDA', tx: '#854F0B', pdfBg: AMBAR_BG, pdfTx: AMBAR_TX };
  return { label: 'Normal', bg: '#EAF3DE', tx: '#3B6D11', pdfBg: VERDE_BG, pdfTx: VERDE_TX };
}

// cabeçalho navy padrão de todos os PDFs de relatório
function criarCabecalhoPDF(subtitulo: string, infoDireita: string) {
  const doc = new jsPDF();
  const largura = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, largura, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Almoxarifado', 18, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY_SUBTLE);
  doc.text(subtitulo, 18, 20);
  doc.setTextColor(255, 255, 255);
  doc.text(infoDireita, largura - 18, 14, { align: 'right' });
  doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, largura - 18, 20, { align: 'right' });
  return { doc, largura };
}

export function Relatorios() {
  const [aba, setAba] = useState<Aba>('movimentacoes');
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState<Material[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mapaCategoria, setMapaCategoria] = useState<Record<string, string>>({});
  const [filtroCategoriaProduto, setFiltroCategoriaProduto] = useState('');

  // --- Estoque por categoria ---
  const [estoqueCategoria, setEstoqueCategoria] = useState('');
  const [estoqueLista, setEstoqueLista] = useState<Material[]>([]);

  function nomeCategoria(codigo: string) {
    return mapaCategoria[codigo] || codigo;
  }

  async function carregar() {
    const params: Record<string, string> = {};
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;
    const [resMov, resBaixo] = await Promise.all([
      api.get('/movimentacoes', { params }),
      api.get('/materiais', { params: { apenasBaixo: 'true' } }),
    ]);
    setMovimentacoes(resMov.data);
    setEstoqueBaixo(resBaixo.data);
  }

  async function carregarEstoquePorCategoria() {
    const params: Record<string, string> = { ordenarPor: 'codigo' };
    if (estoqueCategoria) params.categoria = estoqueCategoria;
    const res = await api.get('/materiais', { params });
    setEstoqueLista(res.data);
  }

  useEffect(() => {
    api.get('/categorias').then((res) => {
      const mapa: Record<string, string> = {};
      res.data.forEach((c: { codigo: string; nome: string }) => (mapa[c.codigo] = c.nome));
      setMapaCategoria(mapa);
    });
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (aba === 'estoque') carregarEstoquePorCategoria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, estoqueCategoria]);

  const consumoPorCategoria = movimentacoes
    .filter((m) => m.tipo === 'SAIDA')
    .reduce<Record<string, number>>((acc, m) => {
      const cat = m.material.categoria;
      acc[cat] = (acc[cat] || 0) + m.quantidade;
      return acc;
    }, {});

  const consumoPorProduto = movimentacoes
    .filter((m) => m.tipo === 'SAIDA')
    .reduce<Record<string, { nome: string; categoria: string; total: number }>>((acc, m) => {
      const chave = m.material.nome;
      if (!acc[chave]) {
        acc[chave] = { nome: m.material.nome, categoria: m.material.categoria, total: 0 };
      }
      acc[chave].total += m.quantidade;
      return acc;
    }, {});

  const listaConsumoPorProduto = Object.values(consumoPorProduto)
    .filter((p) => (filtroCategoriaProduto ? p.categoria === filtroCategoriaProduto : true))
    .sort((a, b) => b.total - a.total);

  function formatarPeriodo() {
    if (!dataInicio && !dataFim) return 'Todo o período';
    const ini = dataInicio ? new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '...';
    const fim = dataFim ? new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '...';
    return `Período: ${ini} até ${fim}`;
  }

  // ---------- Exportar Excel (CSV) ----------
  function exportarExcel() {
    if (aba === 'movimentacoes') {
      exportarCSV('movimentacoes.csv', [
        ['Data', 'Material', 'Categoria', 'Tipo', 'Quantidade', 'Detalhe', 'Registrado por'],
        ...movimentacoes.map((m) => [
          new Date(m.data).toLocaleDateString('pt-BR'),
          m.material.nome,
          nomeCategoria(m.material.categoria),
          m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída',
          String(m.quantidade),
          m.setorDestino || m.fornecedor || '',
          m.usuario.nome,
        ]),
      ]);
    } else if (aba === 'consumo') {
      exportarCSV('consumo-por-categoria.csv', [
        ['Categoria', 'Total consumido (saídas)'],
        ...Object.entries(consumoPorCategoria).map(([cat, total]) => [nomeCategoria(cat), String(total)]),
      ]);
    } else if (aba === 'produto') {
      exportarCSV('consumo-por-produto.csv', [
        ['Produto', 'Categoria', 'Total consumido (saídas)'],
        ...listaConsumoPorProduto.map((p) => [p.nome, nomeCategoria(p.categoria), String(p.total)]),
      ]);
    } else if (aba === 'baixo') {
      exportarCSV('estoque-baixo.csv', [
        ['Material', 'Categoria', 'Estoque atual', 'Estoque mínimo', 'Unidade'],
        ...estoqueBaixo.map((m) => [
          m.nome,
          nomeCategoria(m.categoria),
          String(m.estoqueAtual),
          String(m.estoqueMinimo),
          m.unidade,
        ]),
      ]);
    } else {
      const nomeCat = estoqueCategoria ? nomeCategoria(estoqueCategoria) : 'todos';
      exportarCSV(`estoque-${nomeCat}.csv`, [
        ['Código', 'Material', 'Unidade', 'Nível', 'Estoque atual', 'Estoque mínimo'],
        ...estoqueLista.map((m) => {
          const s = statusEstoque(m.estoqueAtual, m.estoqueMinimo);
          return [m.codigo ?? '', m.nome, m.unidade, s.label, String(m.estoqueAtual), String(m.estoqueMinimo)];
        }),
      ]);
    }
  }

  // ---------- Exportar PDF ----------
  function exportarPDF() {
    if (aba === 'movimentacoes') {
      const { doc } = criarCabecalhoPDF('Relatório de movimentações', formatarPeriodo());
      const linhas = movimentacoes.map((m) => [
        new Date(m.data).toLocaleDateString('pt-BR'),
        m.material.nome,
        nomeCategoria(m.material.categoria),
        m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída',
        String(m.quantidade),
      ]);
      autoTable(doc, {
        startY: 34,
        head: [['Data', 'Material', 'Categoria', 'Tipo', 'Qtd']],
        body: linhas,
        theme: 'plain',
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 5, lineColor: BORDA_CLARA, lineWidth: 0.2 },
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: LINHA_ALT },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const entrada = data.cell.raw === 'Entrada';
            data.cell.styles.fillColor = entrada ? VERDE_BG : VERMELHO_BG;
            data.cell.styles.textColor = entrada ? VERDE_TX : VERMELHO_TX;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      doc.save('movimentacoes.pdf');
    } else if (aba === 'consumo') {
      const { doc } = criarCabecalhoPDF('Relatório de consumo por categoria', formatarPeriodo());
      const linhas = Object.entries(consumoPorCategoria).map(([cat, total]) => [nomeCategoria(cat), String(total)]);
      autoTable(doc, {
        startY: 34,
        head: [['Categoria', 'Total consumido (saídas)']],
        body: linhas,
        theme: 'plain',
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 5, lineColor: BORDA_CLARA, lineWidth: 0.2 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: LINHA_ALT },
      });
      doc.save('consumo-por-categoria.pdf');
    } else if (aba === 'produto') {
      const { doc } = criarCabecalhoPDF('Relatório de consumo por produto', formatarPeriodo());
      const linhas = listaConsumoPorProduto.map((p) => [p.nome, nomeCategoria(p.categoria), String(p.total)]);
      autoTable(doc, {
        startY: 34,
        head: [['Produto', 'Categoria', 'Total consumido (saídas)']],
        body: linhas,
        theme: 'plain',
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 5, lineColor: BORDA_CLARA, lineWidth: 0.2 },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: LINHA_ALT },
      });
      doc.save('consumo-por-produto.pdf');
    } else if (aba === 'baixo') {
      const { doc } = criarCabecalhoPDF('Relatório de estoque baixo', 'Situação atual');
      const linhas = estoqueBaixo.map((m) => [m.nome, nomeCategoria(m.categoria), String(m.estoqueAtual), String(m.estoqueMinimo)]);
      autoTable(doc, {
        startY: 34,
        head: [['Material', 'Categoria', 'Estoque atual', 'Estoque mínimo']],
        body: linhas,
        theme: 'plain',
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 5, lineColor: BORDA_CLARA, lineWidth: 0.2 },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
        alternateRowStyles: { fillColor: LINHA_ALT },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            data.cell.styles.fillColor = VERMELHO_BG;
            data.cell.styles.textColor = VERMELHO_TX;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      doc.save('estoque-baixo.pdf');
    } else {
      const nomeCat = estoqueCategoria ? nomeCategoria(estoqueCategoria) : 'Todos';
      const { doc, largura } = criarCabecalhoPDF('Relatório de estoque por categoria', `Categoria: ${nomeCat}`);

      const totalItens = estoqueLista.length;
      const totalBaixo = estoqueLista.filter((m) => m.estoqueAtual < m.estoqueMinimo).length;
      const totalNoLimite = estoqueLista.filter((m) => m.estoqueAtual === m.estoqueMinimo).length;

      const boxY = 34;
      const boxH = 18;
      const boxW = (largura - 36 - 8) / 3;
      const resumo: [string, string, number[]][] = [
        [String(totalItens), 'Itens na categoria', NAVY],
        [String(totalBaixo), 'Abaixo do mínimo', VERMELHO_TX],
        [String(totalNoLimite), 'No limite', AMBAR_TX],
      ];
      resumo.forEach(([valor, label, cor], i) => {
        const x = 18 + i * (boxW + 4);
        doc.setDrawColor(...BORDA_CLARA);
        doc.rect(x, boxY, boxW, boxH);
        doc.setTextColor(cor[0], cor[1], cor[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(valor, x + 6, boxY + 9);
        doc.setTextColor(95, 94, 90);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(label, x + 6, boxY + 15);
      });

      const linhas = estoqueLista.map((m) => {
        const s = statusEstoque(m.estoqueAtual, m.estoqueMinimo);
        return [m.codigo ?? '', m.nome, m.unidade, s.label, `${m.estoqueAtual} / ${m.estoqueMinimo}`];
      });

      autoTable(doc, {
        startY: boxY + boxH + 8,
        head: [['Código', 'Material', 'Unid.', 'Nível', 'Atual / Mínimo']],
        body: linhas,
        theme: 'plain',
        headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 5, lineColor: BORDA_CLARA, lineWidth: 0.2 },
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
        alternateRowStyles: { fillColor: LINHA_ALT },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const item = estoqueLista[data.row.index];
            if (item) {
              const s = statusEstoque(item.estoqueAtual, item.estoqueMinimo);
              data.cell.styles.fillColor = s.pdfBg;
              data.cell.styles.textColor = s.pdfTx;
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      doc.save(`estoque-${estoqueCategoria || 'todos'}.pdf`);
    }
  }

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold text-texto mb-0.5">Relatórios</h1>
      <p className="text-[12.5px] text-textoSuave mb-5">Histórico e consumo por período</p>

      <div className="flex gap-6 mb-5 border-b border-linha">
        {(['movimentacoes', 'consumo', 'produto', 'baixo', 'estoque'] as Aba[]).map((a) => (
          <span
            key={a}
            onClick={() => setAba(a)}
            className={`pb-2.5 text-[12.5px] font-bold cursor-pointer border-b-2 transition-colors ${
              aba === a ? 'text-azul border-azul' : 'text-textoSuave border-transparent hover:text-texto'
            }`}
          >
            {a === 'movimentacoes'
              ? 'Movimentações'
              : a === 'consumo'
              ? 'Consumo por categoria'
              : a === 'produto'
              ? 'Consumo por produto'
              : a === 'baixo'
              ? 'Estoque baixo'
              : 'Estoque por categoria'}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center text-[12.5px]">
          {aba === 'estoque' ? (
            <select
              className="border border-linha rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white outline-none focus:border-azul"
              value={estoqueCategoria}
              onChange={(e) => setEstoqueCategoria(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(mapaCategoria).map(([codigo, nome]) => (
                <option key={codigo} value={codigo}>
                  {nome}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                type="date"
                className="border border-linha rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white outline-none focus:border-azul"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
              <span className="text-textoSuave">até</span>
              <input
                type="date"
                className="border border-linha rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white outline-none focus:border-azul"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
              <button onClick={carregar} className="border border-linha rounded-lg px-3 py-1.5 font-bold text-[12px] text-texto bg-white hover:bg-fundo">
                Filtrar
              </button>
              {aba === 'produto' && (
                <select
                  className="border border-linha rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white outline-none focus:border-azul"
                  value={filtroCategoriaProduto}
                  onChange={(e) => setFiltroCategoriaProduto(e.target.value)}
                >
                  <option value="">Todas as categorias</option>
                  {Object.entries(mapaCategoria).map(([codigo, nome]) => (
                    <option key={codigo} value={codigo}>
                      {nome}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarExcel}
            className="border border-linha bg-white rounded-lg px-3.5 py-2 font-bold text-[12.5px] text-texto hover:bg-fundo"
          >
            ⤓ Baixar Excel
          </button>
          <button
            onClick={exportarPDF}
            className="border border-azul bg-azul rounded-lg px-3.5 py-2 font-bold text-[12.5px] text-white hover:opacity-90"
          >
            ⤓ Baixar PDF
          </button>
        </div>
      </div>

      {aba === 'movimentacoes' && (
        <div className="bg-white border border-linha rounded-2xl overflow-hidden">
          <table className="w-full text-[12.8px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
                <th className="py-3 px-4 font-bold">Data</th>
                <th className="py-3 px-4 font-bold">Material</th>
                <th className="py-3 px-4 font-bold">Categoria</th>
                <th className="py-3 px-4 font-bold">Tipo</th>
                <th className="py-3 px-4 font-bold">Qtd</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((m) => (
                <tr key={m.id} className="border-b border-linha last:border-none hover:bg-fundo/60">
                  <td className="py-3 px-4 text-textoSuave">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4 font-medium text-texto">{m.material.nome}</td>
                  <td className="py-3 px-4 text-textoSuave">{nomeCategoria(m.material.categoria)}</td>
                  <td className="py-3 px-4 text-textoSuave">{m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</td>
                  <td className="py-3 px-4 font-mono text-texto">{m.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'consumo' && (
        <div className="bg-white border border-linha rounded-2xl overflow-hidden">
          <table className="w-full text-[12.8px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
                <th className="py-3 px-4 font-bold">Categoria</th>
                <th className="py-3 px-4 font-bold">Total consumido (saídas)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(consumoPorCategoria).map(([cat, total]) => (
                <tr key={cat} className="border-b border-linha last:border-none hover:bg-fundo/60">
                  <td className="py-3 px-4 font-medium text-texto">{nomeCategoria(cat)}</td>
                  <td className="py-3 px-4 font-mono text-texto">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'produto' && (
        <div className="bg-white border border-linha rounded-2xl overflow-hidden">
          <table className="w-full text-[12.8px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
                <th className="py-3 px-4 font-bold">Produto</th>
                <th className="py-3 px-4 font-bold">Categoria</th>
                <th className="py-3 px-4 font-bold">Total consumido (saídas)</th>
              </tr>
            </thead>
            <tbody>
              {listaConsumoPorProduto.map((p) => (
                <tr key={p.nome} className="border-b border-linha last:border-none hover:bg-fundo/60">
                  <td className="py-3 px-4 font-medium text-texto">{p.nome}</td>
                  <td className="py-3 px-4 text-textoSuave">{nomeCategoria(p.categoria)}</td>
                  <td className="py-3 px-4 font-mono text-texto">{p.total}</td>
                </tr>
              ))}
              {listaConsumoPorProduto.length === 0 && (
                <tr>
                  <td className="py-4 px-4 text-textoSuave" colSpan={3}>
                    Nenhum consumo encontrado para o período/categoria selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'baixo' && (
        <div className="bg-white border border-linha rounded-2xl overflow-hidden">
          <table className="w-full text-[12.8px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
                <th className="py-3 px-4 font-bold">Material</th>
                <th className="py-3 px-4 font-bold">Categoria</th>
                <th className="py-3 px-4 font-bold">Estoque atual</th>
                <th className="py-3 px-4 font-bold">Estoque mínimo</th>
              </tr>
            </thead>
            <tbody>
              {estoqueBaixo.map((m) => (
                <tr key={m.id} className="border-b border-linha last:border-none hover:bg-fundo/60">
                  <td className="py-3 px-4 font-medium text-texto">{m.nome}</td>
                  <td className="py-3 px-4 text-textoSuave">{nomeCategoria(m.categoria)}</td>
                  <td className="py-3 px-4 font-mono text-alerta font-semibold">{m.estoqueAtual}</td>
                  <td className="py-3 px-4 font-mono text-texto">{m.estoqueMinimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === 'estoque' && (
        <div className="bg-white border border-linha rounded-2xl overflow-hidden">
          <table className="w-full text-[12.8px]">
            <thead>
              <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
                <th className="py-3 px-4 font-bold">Código</th>
                <th className="py-3 px-4 font-bold">Material</th>
                <th className="py-3 px-4 font-bold">Unidade</th>
                <th className="py-3 px-4 font-bold">Nível</th>
                <th className="py-3 px-4 font-bold">Atual / Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {estoqueLista.map((m) => {
                const s = statusEstoque(m.estoqueAtual, m.estoqueMinimo);
                return (
                  <tr key={m.id} className="border-b border-linha last:border-none hover:bg-fundo/60">
                    <td className="py-3 px-4 font-medium text-azul">{m.codigo}</td>
                    <td className="py-3 px-4 font-medium text-texto">{m.nome}</td>
                    <td className="py-3 px-4 text-textoSuave">{m.unidade}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-1 rounded-md text-[11px] font-bold"
                        style={{ backgroundColor: s.bg, color: s.tx }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-texto text-right">
                      {m.estoqueAtual} / {m.estoqueMinimo}
                    </td>
                  </tr>
                );
              })}
              {estoqueLista.length === 0 && (
                <tr>
                  <td className="py-4 px-4 text-textoSuave" colSpan={5}>
                    Nenhum material encontrado para essa categoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
