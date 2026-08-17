import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardData } from '../types';

const categoriaLabel: Record<string, string> = {
  EPI: 'EPI',
  LIMPEZA: 'Limpeza',
  ESCRITORIO: 'Escritório',
  OUTROS: 'Outros',
};

const categoriaCor: Record<string, string> = {
  EPI: 'bg-[#FCEBEA] text-vermelho',
  LIMPEZA: 'bg-[#EAF3E3] text-verde',
  ESCRITORIO: 'bg-[#FCF3D6] text-[#92720A]',
  OUTROS: 'bg-[#EFEAE0] text-[#6B6259]',
};

export function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setDados(res.data))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <p className="text-sm text-[#6B6259]">Carregando...</p>;
  if (!dados) return <p className="text-sm text-vermelho">Não foi possível carregar os dados.</p>;

  return (
    <div>
      <h1 className="text-lg font-extrabold mb-0.5">Visão geral</h1>
      <p className="text-[12.5px] text-[#6B6259] mb-5">Resumo do estoque em tempo real</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="border border-[#E8E0D2] rounded-xl p-4 bg-white">
          <div className="text-[11px] font-bold text-[#6B6259] uppercase">Itens cadastrados</div>
          <div className="text-2xl font-extrabold mt-1.5 font-mono">{dados.totalMateriais}</div>
        </div>
        <div className="border border-[#F3D6D4] rounded-xl p-4 bg-[#FCF3F2]">
          <div className="text-[11px] font-bold text-[#6B6259] uppercase">Estoque baixo</div>
          <div className="text-2xl font-extrabold mt-1.5 font-mono text-vermelho">{dados.estoqueBaixoCount}</div>
        </div>
        <div className="border border-[#E8E0D2] rounded-xl p-4 bg-white">
          <div className="text-[11px] font-bold text-[#6B6259] uppercase">Entradas (mês)</div>
          <div className="text-2xl font-extrabold mt-1.5 font-mono text-verde">{dados.entradasMes}</div>
        </div>
        <div className="border border-[#E8E0D2] rounded-xl p-4 bg-white">
          <div className="text-[11px] font-bold text-[#6B6259] uppercase">Saídas (mês)</div>
          <div className="text-2xl font-extrabold mt-1.5 font-mono">{dados.saidasMes}</div>
        </div>
      </div>

      {dados.estoqueBaixoLista.length > 0 && (
        <div className="mb-6 bg-[#FCF3F2] border border-[#F3D6D4] rounded-xl p-4">
          <p className="text-[12.5px] font-bold text-vermelho mb-2">Itens abaixo do estoque mínimo</p>
          <div className="flex flex-wrap gap-2">
            {dados.estoqueBaixoLista.map((m) => (
              <span key={m.id} className="text-[11.5px] bg-white border border-[#F3D6D4] rounded-full px-3 py-1 font-semibold">
                {m.nome}: {m.estoqueAtual}/{m.estoqueMinimo} {m.unidade}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12.5px] font-bold mb-2">Últimas movimentações</p>
      <div className="bg-white border border-[#E8E0D2] rounded-xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase text-[#6B6259] border-b border-[#E8E0D2]">
              <th className="py-2.5 px-3">Data</th>
              <th className="py-2.5 px-3">Material</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3">Qtd</th>
              <th className="py-2.5 px-3">Responsável / Destino</th>
            </tr>
          </thead>
          <tbody>
            {dados.ultimasMovimentacoes.map((m) => (
              <tr key={m.id} className="border-b border-[#E8E0D2] last:border-none">
                <td className="py-2.5 px-3">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                <td className="py-2.5 px-3">{m.material.nome}</td>
                <td className="py-2.5 px-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${categoriaCor[m.material.categoria]}`}>
                    {categoriaLabel[m.material.categoria]}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono">
                  {m.tipo === 'ENTRADA' ? '+' : '-'}
                  {m.quantidade}
                </td>
                <td className="py-2.5 px-3">{m.setorDestino || m.fornecedor || '—'}</td>
              </tr>
            ))}
            {dados.ultimasMovimentacoes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 px-3 text-center text-[#6B6259]">
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
