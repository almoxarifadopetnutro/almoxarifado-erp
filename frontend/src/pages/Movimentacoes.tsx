import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Material, Movimentacao, TipoMovimentacao } from '../types';

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

export function Movimentacoes() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [historico, setHistorico] = useState<Movimentacao[]>([]);
  const [tipo, setTipo] = useState<TipoMovimentacao>('ENTRADA');
  const [materialId, setMaterialId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [data, setData] = useState(hojeISO());
  const [fornecedor, setFornecedor] = useState('');
  const [setorDestino, setSetorDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [resMateriais, resHistorico] = await Promise.all([
      api.get('/materiais'),
      api.get('/movimentacoes'),
    ]);
    setMateriais(resMateriais.data);
    setHistorico(resHistorico.data);
    if (!materialId && resMateriais.data.length > 0) setMaterialId(resMateriais.data[0].id);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparCamposEspecificos() {
    setFornecedor('');
    setSetorDestino('');
    setMotivo('');
  }

  async function registrar() {
    setErro('');
    setSucesso('');
    if (!materialId || !quantidade) {
      setErro('Selecione o material e informe a quantidade.');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/movimentacoes', {
        tipo,
        materialId,
        quantidade: Number(quantidade),
        data,
        fornecedor: tipo === 'ENTRADA' ? fornecedor : undefined,
        setorDestino: tipo === 'SAIDA' ? setorDestino : undefined,
        motivo: tipo === 'SAIDA' ? motivo : undefined,
        observacao,
      });
      setSucesso(`${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} registrada com sucesso.`);
      setQuantidade('');
      setObservacao('');
      limparCamposEspecificos();
      carregar();
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Não foi possível registrar a movimentação.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-extrabold mb-0.5">Nova movimentação</h1>
      <p className="text-[12.5px] text-[#6B6259] mb-4">Registrar entrada ou saída de material</p>

      <div className="flex gap-2.5 mb-4 max-w-md">
        <button
          onClick={() => {
            setTipo('ENTRADA');
            limparCamposEspecificos();
          }}
          className={`flex-1 rounded-xl py-3.5 text-center font-bold text-[13px] border-[1.5px] ${
            tipo === 'ENTRADA' ? 'border-verde bg-[#F2F8ED] text-verde' : 'border-[#E8E0D2] text-[#6B6259]'
          }`}
        >
          ↓ Entrada
        </button>
        <button
          onClick={() => {
            setTipo('SAIDA');
            limparCamposEspecificos();
          }}
          className={`flex-1 rounded-xl py-3.5 text-center font-bold text-[13px] border-[1.5px] ${
            tipo === 'SAIDA' ? 'border-vermelho bg-[#FCEBEA] text-vermelho' : 'border-[#E8E0D2] text-[#6B6259]'
          }`}
        >
          ↑ Saída
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-w-lg">
        <div className="col-span-2">
          <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Material</label>
          <select
            className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
            value={materialId}
            onChange={(e) => setMaterialId(e.target.value)}
          >
            {materiais.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} — saldo atual: {m.estoqueAtual} {m.unidade}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Quantidade</label>
          <input
            type="number"
            className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Ex: 50"
          />
        </div>
        <div>
          <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Data</label>
          <input
            type="date"
            className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>

        {tipo === 'ENTRADA' ? (
          <div className="col-span-2">
            <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Fornecedor</label>
            <input
              className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: Higicel Distribuidora"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div>
              <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Setor / Destino</label>
              <input
                className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                placeholder="Ex: Setor Produção"
                value={setorDestino}
                onChange={(e) => setSetorDestino(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Motivo da retirada</label>
              <input
                className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                placeholder="Ex: Uso diário"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="col-span-2">
          <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Observação (opcional)</label>
          <input
            className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
            placeholder="Nota fiscal, condição do lote, etc."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>
      </div>

      {erro && <p className="text-vermelho text-[12.5px] font-semibold mt-3">{erro}</p>}
      {sucesso && <p className="text-verde text-[12.5px] font-semibold mt-3">{sucesso}</p>}

      <button
        onClick={registrar}
        disabled={salvando}
        className="bg-vermelho text-white font-bold text-[12.5px] rounded-lg px-5 py-2.5 mt-4 disabled:opacity-60"
      >
        {salvando ? 'Registrando...' : tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar saída'}
      </button>

      <p className="text-[12.5px] font-bold mt-8 mb-2">Últimas movimentações</p>
      <div className="bg-white border border-[#E8E0D2] rounded-xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase text-[#6B6259] border-b border-[#E8E0D2]">
              <th className="py-2.5 px-3">Data</th>
              <th className="py-2.5 px-3">Material</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3">Qtd</th>
              <th className="py-2.5 px-3">Detalhe</th>
              <th className="py-2.5 px-3">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {historico.slice(0, 15).map((m) => (
              <tr key={m.id} className="border-b border-[#E8E0D2] last:border-none">
                <td className="py-2.5 px-3">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                <td className="py-2.5 px-3">{m.material.nome}</td>
                <td className="py-2.5 px-3">
                  <span className={m.tipo === 'ENTRADA' ? 'text-verde font-bold' : 'text-vermelho font-bold'}>
                    {m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono">{m.quantidade}</td>
                <td className="py-2.5 px-3">{m.setorDestino || m.fornecedor || '—'}</td>
                <td className="py-2.5 px-3">{m.usuario.nome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
