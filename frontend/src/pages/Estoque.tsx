import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Material, Categoria } from '../types';

const categoriaLabel: Record<Categoria, string> = {
  EPI: 'EPI',
  LIMPEZA: 'Limpeza',
  ESCRITORIO: 'Escritório',
  OUTROS: 'Outros',
};

const categoriaCodigo: Record<Categoria, string> = {
  EPI: 'EPI',
  LIMPEZA: 'LPZ',
  ESCRITORIO: 'ESC',
  OUTROS: 'OTR',
};

type AbaCategoria = 'TODOS' | Categoria;
type OrdenarPor = 'nome' | 'codigo';

const abas: AbaCategoria[] = ['TODOS', 'EPI', 'LIMPEZA', 'ESCRITORIO', 'OUTROS'];

const vazio = { nome: '', categoria: 'EPI' as Categoria, unidade: '', estoqueMinimo: '0', estoqueAtual: '0' };

function Medidor({ atual, minimo }: { atual: number; minimo: number }) {
  const alvo = minimo > 0 ? minimo * 2 : atual || 1;
  const pct = Math.min(100, Math.round((atual / alvo) * 100));
  const baixo = atual < minimo;
  return (
    <div className="medidor-track w-16">
      <div className="medidor-fill" style={{ width: `${pct}%`, backgroundColor: baixo ? '#DC2626' : '#2F6FEE' }} />
    </div>
  );
}

export function Estoque() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState<AbaCategoria>('TODOS');
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>('codigo');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Material | null>(null);
  const [form, setForm] = useState(vazio);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const { data } = await api.get('/materiais', {
      params: {
        ...(busca ? { busca } : {}),
        ordenarPor,
      },
    });
    setMateriais(data);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenarPor]);

  const materiaisFiltrados = aba === 'TODOS' ? materiais : materiais.filter((m) => m.categoria === aba);

  const contagemPorCategoria = abas.reduce<Record<string, number>>((acc, a) => {
    acc[a] = a === 'TODOS' ? materiais.length : materiais.filter((m) => m.categoria === a).length;
    return acc;
  }, {});

  function abrirNovo() {
    setEditando(null);
    setForm({ ...vazio, categoria: aba === 'TODOS' ? 'EPI' : (aba as Categoria) });
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
      <h1 className="font-display text-[22px] font-extrabold text-texto mb-0.5">Estoque</h1>
      <p className="text-[12.5px] text-textoSuave mb-5">Cadastro e saldo atual de cada item, por categoria</p>

      {/* abas por categoria */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {abas.map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-3.5 py-2 rounded-lg text-[12.5px] font-bold transition-colors flex items-center gap-1.5 ${
              aba === a ? 'bg-marinho text-white' : 'bg-white text-textoSuave border border-linha hover:bg-fundo'
            }`}
          >
            {a === 'TODOS' ? 'Todos' : categoriaLabel[a]}
            <span className={`text-[10.5px] font-mono ${aba === a ? 'text-white/70' : 'text-textoSuave/70'}`}>
              {contagemPorCategoria[a]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex gap-2.5 items-center">
          <input
            className="border border-linha rounded-lg px-3.5 py-2.5 text-[12.5px] w-60 outline-none focus:border-azul focus:ring-2 focus:ring-azul/15 transition bg-white"
            placeholder="Buscar material..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregar()}
          />
          <select
            className="border border-linha rounded-lg px-3 py-2.5 text-[12.5px] bg-white outline-none focus:border-azul"
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as OrdenarPor)}
          >
            <option value="codigo">Ordenar por código</option>
            <option value="nome">Ordenar por nome</option>
          </select>
        </div>
        <button onClick={abrirNovo} className="bg-azul hover:bg-[#2660D6] transition-colors text-white font-bold text-[12.5px] rounded-lg px-4 py-2.5">
          + Novo material
        </button>
      </div>

      <div className="bg-white border border-linha rounded-2xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave border-b border-linha">
              <th className="py-3 px-4 font-bold">Código</th>
              <th className="py-3 px-4 font-bold">Material</th>
              {aba === 'TODOS' && <th className="py-3 px-4 font-bold">Categoria</th>}
              <th className="py-3 px-4 font-bold">Unidade</th>
              <th className="py-3 px-4 font-bold">Nível de estoque</th>
              <th className="py-3 px-4 font-bold">Atual / Mínimo</th>
              <th className="py-3 px-4 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {materiaisFiltrados.map((m) => (
              <tr key={m.id} className="border-b border-linha last:border-none hover:bg-fundo/60">
                <td className="py-3 px-4 font-mono text-azul font-semibold">{m.codigo || '—'}</td>
                <td className="py-3 px-4 font-medium text-texto">{m.nome}</td>
                {aba === 'TODOS' && <td className="py-3 px-4 text-textoSuave">{categoriaLabel[m.categoria]}</td>}
                <td className="py-3 px-4 text-textoSuave">{m.unidade}</td>
                <td className="py-3 px-4">
                  <Medidor atual={m.estoqueAtual} minimo={m.estoqueMinimo} />
                </td>
                <td className="py-3 px-4 font-mono text-texto">
                  {m.estoqueAtual}
                  <span className="text-textoSuave"> / {m.estoqueMinimo}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => abrirEdicao(m)} className="text-[12px] font-semibold text-azul">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!carregando && materiaisFiltrados.length === 0 && (
              <tr>
                <td colSpan={aba === 'TODOS' ? 7 : 6} className="py-6 px-4 text-center text-textoSuave">
                  Nenhum material encontrado nessa categoria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-marinho/40 flex items-center justify-center z-50" onClick={() => setModalAberto(false)}>
          <div className="bg-white rounded-2xl p-6 w-[420px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-extrabold text-base text-texto mb-1">{editando ? 'Editar material' : 'Novo material'}</h2>
            {editando?.codigo && (
              <p className="text-[11.5px] font-mono text-azul font-semibold mb-3">{editando.codigo}</p>
            )}
            {!editando && (
              <p className="text-[11px] text-textoSuave mb-4">
                O código será gerado automaticamente ao salvar, no formato {categoriaCodigo[form.categoria]}-XXX.
              </p>
            )}

            <div className="space-y-3 mt-3">
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Nome</label>
                <input
                  className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Categoria</label>
                <select
                  className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
                >
                  <option value="EPI">EPI (EPI-XXX)</option>
                  <option value="LIMPEZA">Limpeza (LPZ-XXX)</option>
                  <option value="ESCRITORIO">Escritório (ESC-XXX)</option>
                  <option value="OUTROS">Outros (OTR-XXX)</option>
                </select>
                {editando && editando.categoria !== form.categoria && (
                  <p className="text-[10.5px] text-alerta mt-1">Mudar a categoria vai gerar um novo código.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Unidade</label>
                  <input
                    className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
                    placeholder="Un, Par, Resma..."
                    value={form.unidade}
                    onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Estoque mínimo</label>
                  <input
                    type="number"
                    className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
                    value={form.estoqueMinimo}
                    onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
                  />
                </div>
              </div>
              {!editando && (
                <div>
                  <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Estoque inicial</label>
                  <input
                    type="number"
                    className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
                    value={form.estoqueAtual}
                    onChange={(e) => setForm({ ...form, estoqueAtual: e.target.value })}
                  />
                </div>
              )}
            </div>

            {erro && <p className="text-alerta text-[12px] font-semibold mt-3">{erro}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 border border-linha rounded-lg py-2 text-[12.5px] font-bold text-texto"
              >
                Cancelar
              </button>
              <button onClick={salvar} className="flex-1 bg-azul hover:bg-[#2660D6] transition-colors text-white rounded-lg py-2 text-[12.5px] font-bold">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
