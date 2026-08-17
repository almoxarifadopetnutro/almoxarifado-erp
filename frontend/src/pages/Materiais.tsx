import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Material, Categoria } from '../types';

const categoriaLabel: Record<Categoria, string> = {
  EPI: 'EPI',
  LIMPEZA: 'Limpeza',
  ESCRITORIO: 'Escritório',
  OUTROS: 'Outros',
};

const categoriaCor: Record<Categoria, string> = {
  EPI: 'bg-[#FCEBEA] text-vermelho',
  LIMPEZA: 'bg-[#EAF3E3] text-verde',
  ESCRITORIO: 'bg-[#FCF3D6] text-[#92720A]',
  OUTROS: 'bg-[#EFEAE0] text-[#6B6259]',
};

const vazio = { nome: '', categoria: 'EPI' as Categoria, unidade: '', estoqueMinimo: '0', estoqueAtual: '0' };

export function Materiais() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Material | null>(null);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get('/materiais', { params: busca ? { busca } : {} });
    setMateriais(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(vazio);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(m: Material) {
    setEditando(m);
    setForm({
      nome: m.nome,
      categoria: m.categoria,
      unidade: m.unidade,
      estoqueMinimo: String(m.estoqueMinimo),
      estoqueAtual: String(m.estoqueAtual),
    });
    setErro('');
    setModalAberto(true);
  }

  async function salvar() {
    setErro('');
    try {
      if (editando) {
        await api.put(`/materiais/${editando.id}`, {
          nome: form.nome,
          categoria: form.categoria,
          unidade: form.unidade,
          estoqueMinimo: Number(form.estoqueMinimo),
        });
      } else {
        await api.post('/materiais', {
          nome: form.nome,
          categoria: form.categoria,
          unidade: form.unidade,
          estoqueMinimo: Number(form.estoqueMinimo),
          estoqueAtual: Number(form.estoqueAtual),
        });
      }
      setModalAberto(false);
      carregar();
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Não foi possível salvar.');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-extrabold mb-0.5">Materiais</h1>
      <p className="text-[12.5px] text-[#6B6259] mb-4">Cadastro e saldo atual de cada item</p>

      <div className="flex justify-between items-center mb-3.5">
        <input
          className="border border-[#E8E0D2] rounded-lg px-3 py-2 text-[12.5px] w-56"
          placeholder="Buscar material..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && carregar()}
        />
        <button onClick={abrirNovo} className="bg-vermelho text-white font-bold text-[12.5px] rounded-lg px-4 py-2">
          + Novo material
        </button>
      </div>

      <div className="bg-white border border-[#E8E0D2] rounded-xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase text-[#6B6259] border-b border-[#E8E0D2]">
              <th className="py-2.5 px-3">Material</th>
              <th className="py-2.5 px-3">Categoria</th>
              <th className="py-2.5 px-3">Unidade</th>
              <th className="py-2.5 px-3">Estoque atual</th>
              <th className="py-2.5 px-3">Estoque mínimo</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {materiais.map((m) => (
              <tr key={m.id} className="border-b border-[#E8E0D2] last:border-none">
                <td className="py-2.5 px-3">{m.nome}</td>
                <td className="py-2.5 px-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${categoriaCor[m.categoria]}`}>
                    {categoriaLabel[m.categoria]}
                  </span>
                </td>
                <td className="py-2.5 px-3">{m.unidade}</td>
                <td className="py-2.5 px-3 font-mono">{m.estoqueAtual}</td>
                <td className="py-2.5 px-3 font-mono">{m.estoqueMinimo}</td>
                <td className="py-2.5 px-3">
                  {m.estoqueBaixo ? (
                    <span className="text-vermelho font-bold text-[11.5px]">● Baixo</span>
                  ) : (
                    <span className="text-verde font-bold text-[11.5px]">● OK</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button onClick={() => abrirEdicao(m)} className="text-[12px] font-semibold text-vermelho">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!carregando && materiais.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 px-3 text-center text-[#6B6259]">
                  Nenhum material encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setModalAberto(false)}>
          <div
            className="bg-white rounded-2xl p-6 w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-extrabold text-base mb-4">{editando ? 'Editar material' : 'Novo material'}</h2>

            <div className="space-y-3">
              <div>
                <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Nome</label>
                <input
                  className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Categoria</label>
                <select
                  className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
                >
                  <option value="EPI">EPI</option>
                  <option value="LIMPEZA">Limpeza</option>
                  <option value="ESCRITORIO">Escritório</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Unidade</label>
                  <input
                    className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                    placeholder="Un, Par, Resma..."
                    value={form.unidade}
                    onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Estoque mínimo</label>
                  <input
                    type="number"
                    className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                    value={form.estoqueMinimo}
                    onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
                  />
                </div>
              </div>
              {!editando && (
                <div>
                  <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Estoque inicial</label>
                  <input
                    type="number"
                    className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                    value={form.estoqueAtual}
                    onChange={(e) => setForm({ ...form, estoqueAtual: e.target.value })}
                  />
                </div>
              )}
            </div>

            {erro && <p className="text-vermelho text-[12px] font-semibold mt-3">{erro}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 border border-[#E8E0D2] rounded-lg py-2 text-[12.5px] font-bold"
              >
                Cancelar
              </button>
              <button onClick={salvar} className="flex-1 bg-vermelho text-white rounded-lg py-2 text-[12.5px] font-bold">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
