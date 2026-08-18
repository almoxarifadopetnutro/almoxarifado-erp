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
      <h1 className="font-display text-[22px] font-extrabold text-texto mb-0.5">Nova movimentação</h1>
      <p className="text-[12.5px] text-textoSuave mb-5">Registrar entrada ou saída de material</p>

      <div className="flex gap-2.5 mb-5 max-w-md">
        <button
          onClick={() => {
            setTipo('ENTRADA');
            limparCamposEspecificos();
          }}
          className={`flex-1 rounded-xl py-3.5 text-center font-bold text-[13px] border-[1.5px] transition-colors ${
            tipo === 'ENTRADA' ? 'border-ok bg-okClaro text-ok' : 'border-linha text-textoSuave bg-white'
          }`}
        >
          ↓ Entrada
        </button>
        <button
          onClick={() => {
            setTipo('SAIDA');
            limparCamposEspecificos();
          }}
          className={`flex-1 rounded-xl py-3.5 text-center font-bold text-[13px] border-[1.5px] transition-colors ${
            tipo === 'SAIDA' ? 'border-alerta bg-alertaClaro text-alerta' : 'border-linha text-textoSuave bg-white'
          }`}
        >
          ↑ Saída
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-w-lg">
        <div className="col-span-2">
          <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Material</label>
          <select
            className="w-full border border-linha rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
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
          <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Quantidade</label>
          <input
            type="number"
            className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Ex: 50"
          />
        </div>
        <div>
          <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Data</label>
          <input
            type="date"
            className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </div>

        {tipo === 'ENTRADA' ? (
          <div className="col-span-2">
            <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Fornecedor</label>
            <input
              className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
              placeholder="Ex: Higicel Distribuidora"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div>
              <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Setor / Destino</label>
              <input
                className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
                placeholder="Ex: Setor Produção"
                value={setorDestino}
                onChange={(e) => setSetorDestino(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Motivo da retirada</label>
              <input
                className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
                placeholder="Ex: Uso diário"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="col-span-2">
          <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Observação (opcional)</label>
          <input
            className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
            placeholder="Nota fiscal, condição do lote, etc."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>
      </div>

      {erro && <p className="text-alerta text-[12.5px] font-semibold mt-3">{erro}</p>}
      {sucesso && <p className="text-ok text-[12.5px] font-semibold mt-3">{sucesso}</p>}

      <button
        onClick={registrar}
        disabled={salvando}
        className="bg-azul hover:bg-[#2660D6] transition-colors text-white font-bold text-[12.5px] rounded-lg px-5 py-2.5 mt-4 disabled:opacity-60"
      >
        {salvando ? 'Registrando...' : tipo === 'ENTRADA' ? 'Registrar entrada' : 'Registrar saída'}
      </button>

      <p className="text-[12.5px] font-bold text-texto mt-9 mb-2.5">Últimas movimentações</p>
      <div className="bg-white border border-linha rounded-2xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
              <th className="py-3 px-4 font-bold">Data</th>
              <th className="py-3 px-4 font-bold">Material</th>
              <th className="py-3 px-4 font-bold">Tipo</th>
              <th className="py-3 px-4 font-bold">Qtd</th>
              <th className="py-3 px-4 font-bold">Detalhe</th>
              <th className="py-3 px-4 font-bold">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {historico.slice(0, 15).map((m) => (
              <tr key={m.id} className="border-b border-linha last:border-none hover:bg-fundo/60">
                <td className="py-3 px-4 text-textoSuave">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                <td className="py-3 px-4 font-medium text-texto">{m.material.nome}</td>
                <td className="py-3 px-4">
                  <span className={m.tipo === 'ENTRADA' ? 'text-ok font-bold' : 'text-alerta font-bold'}>
                    {m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono text-texto">{m.quantidade}</td>
                <td className="py-3 px-4 text-textoSuave">{m.setorDestino || m.fornecedor || '—'}</td>
                <td className="py-3 px-4 text-textoSuave">{m.usuario.nome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
