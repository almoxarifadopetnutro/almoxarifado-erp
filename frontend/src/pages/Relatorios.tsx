import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Material, Movimentacao } from '../types';

type Aba = 'movimentacoes' | 'consumo' | 'baixo';

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

export function Relatorios() {
  const [aba, setAba] = useState<Aba>('movimentacoes');
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState<Material[]>([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [mapaCategoria, setMapaCategoria] = useState<Record<string, string>>({});

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

  useEffect(() => {
    api.get('/categorias').then((res) => {
      const mapa: Record<string, string> = {};
      res.data.forEach((c: { codigo: string; nome: string }) => (mapa[c.codigo] = c.nome));
      setMapaCategoria(mapa);
    });
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumoPorCategoria = movimentacoes
    .filter((m) => m.tipo === 'SAIDA')
    .reduce<Record<string, number>>((acc, m) => {
      const cat = m.material.categoria;
      acc[cat] = (acc[cat] || 0) + m.quantidade;
      return acc;
    }, {});

  function exportar() {
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
    } else {
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
    }
  }

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold text-texto mb-0.5">Relatórios</h1>
      <p className="text-[12.5px] text-textoSuave mb-5">Histórico e consumo por período</p>

      <div className="flex gap-6 mb-5 border-b border-linha">
        {(['movimentacoes', 'consumo', 'baixo'] as Aba[]).map((a) => (
          <span
            key={a}
            onClick={() => setAba(a)}
            className={`pb-2.5 text-[12.5px] font-bold cursor-pointer border-b-2 transition-colors ${
              aba === a ? 'text-azul border-azul' : 'text-textoSuave border-transparent hover:text-texto'
            }`}
          >
            {a === 'movimentacoes' ? 'Movimentações' : a === 'consumo' ? 'Consumo por categoria' : 'Estoque baixo'}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center text-[12.5px]">
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
        </div>
        <button onClick={exportar} className="border border-linha bg-white rounded-lg px-3.5 py-2 font-bold text-[12.5px] text-texto hover:bg-fundo">
          ⤓ Exportar CSV / Excel
        </button>
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
    </div>
  );
}
