import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardData } from '../types';

function Medidor({ atual, minimo }: { atual: number; minimo: number }) {
  const alvo = minimo > 0 ? minimo * 2 : atual || 1;
  const pct = Math.min(100, Math.round((atual / alvo) * 100));
  const baixo = atual < minimo;
  return (
    <div className="medidor-track w-14">
      <div
        className="medidor-fill"
        style={{ width: `${pct}%`, backgroundColor: baixo ? '#DC2626' : '#2F6FEE' }}
      />
    </div>
  );
}

export function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [mapaCategoria, setMapaCategoria] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setDados(res.data))
      .finally(() => setCarregando(false));
    api.get('/categorias').then((res) => {
      const mapa: Record<string, string> = {};
      res.data.forEach((c: { codigo: string; nome: string }) => (mapa[c.codigo] = c.nome));
      setMapaCategoria(mapa);
    });
  }, []);

  if (carregando) return <p className="text-sm text-textoSuave">Carregando...</p>;
  if (!dados) return <p className="text-sm text-alerta">Não foi possível carregar os dados.</p>;

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold text-texto mb-0.5">Visão geral</h1>
      <p className="text-[12.5px] text-textoSuave mb-6">Resumo do estoque em tempo real</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
        <div className="border border-linha rounded-2xl p-4 bg-white">
          <div className="text-[11px] font-bold text-textoSuave uppercase tracking-wide">Itens cadastrados</div>
          <div className="text-[28px] font-mono font-semibold mt-1.5 text-texto">{dados.totalMateriais}</div>
        </div>
        <div className="border border-alertaClaro rounded-2xl p-4 bg-alertaClaro">
          <div className="text-[11px] font-bold text-textoSuave uppercase tracking-wide">Estoque baixo</div>
          <div className="text-[28px] font-mono font-semibold mt-1.5 text-alerta">{dados.estoqueBaixoCount}</div>
        </div>
        <div className="border border-linha rounded-2xl p-4 bg-white">
          <div className="text-[11px] font-bold text-textoSuave uppercase tracking-wide">Entradas (mês)</div>
          <div className="text-[28px] font-mono font-semibold mt-1.5 text-ok">{dados.entradasMes}</div>
        </div>
        <div className="border border-linha rounded-2xl p-4 bg-white">
          <div className="text-[11px] font-bold text-textoSuave uppercase tracking-wide">Saídas (mês)</div>
          <div className="text-[28px] font-mono font-semibold mt-1.5 text-azul">{dados.saidasMes}</div>
        </div>
      </div>

      {dados.estoqueBaixoLista.length > 0 && (
        <div className="mb-7 bg-white border border-linha rounded-2xl p-4">
          <p className="text-[12.5px] font-bold text-texto mb-3">Itens abaixo do estoque mínimo</p>
          <div className="space-y-2.5">
            {dados.estoqueBaixoLista.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-[12px] font-semibold text-texto w-40 truncate">{m.nome}</span>
                <Medidor atual={m.estoqueAtual} minimo={m.estoqueMinimo} />
                <span className="text-[11px] font-mono text-textoSuave">
                  {m.estoqueAtual}/{m.estoqueMinimo} {m.unidade}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12.5px] font-bold text-texto mb-2.5">Últimas movimentações</p>
      <div className="bg-white border border-linha rounded-2xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
              <th className="py-3 px-4 font-bold">Data</th>
              <th className="py-3 px-4 font-bold">Material</th>
              <th className="py-3 px-4 font-bold">Categoria</th>
              <th className="py-3 px-4 font-bold">Qtd</th>
              <th className="py-3 px-4 font-bold">Responsável / Destino</th>
            </tr>
          </thead>
          <tbody>
            {dados.ultimasMovimentacoes.map((m) => (
              <tr key={m.id} className="border-b border-linha last:border-none hover:bg-fundo/60">
                <td className="py-3 px-4 text-textoSuave">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                <td className="py-3 px-4 font-medium text-texto">{m.material.nome}</td>
                <td className="py-3 px-4 text-textoSuave">{mapaCategoria[m.material.categoria] || m.material.categoria}</td>
                <td className={`py-3 px-4 font-mono font-semibold ${m.tipo === 'ENTRADA' ? 'text-ok' : 'text-alerta'}`}>
                  {m.tipo === 'ENTRADA' ? '+' : '-'}
                  {m.quantidade}
                </td>
                <td className="py-3 px-4 text-textoSuave">{m.setorDestino || m.fornecedor || '—'}</td>
              </tr>
            ))}
            {dados.ultimasMovimentacoes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-textoSuave">
                  Nenhuma movimentação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
