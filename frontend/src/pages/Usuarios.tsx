import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Usuario } from '../types';

const vazioNovo = { nome: '', usuario: '', senha: '', perfil: 'ALMOXARIFE' as 'ADMINISTRADOR' | 'ALMOXARIFE' };

export function Usuarios() {
  const { usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [erroLista, setErroLista] = useState('');

  // modal de novo usuário
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novo, setNovo] = useState(vazioNovo);
  const [erroNovo, setErroNovo] = useState('');

  // modal de edição
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [perfilEdicao, setPerfilEdicao] = useState<'ADMINISTRADOR' | 'ALMOXARIFE'>('ALMOXARIFE');
  const [ativoEdicao, setAtivoEdicao] = useState(true);
  const [erroEdicao, setErroEdicao] = useState('');

  // modal de redefinir senha
  const [redefinindo, setRedefinindo] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');

  // modal de exclusão
  const [excluindo, setExcluindo] = useState<Usuario | null>(null);
  const [erroExclusao, setErroExclusao] = useState('');

  async function carregar() {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (err: any) {
      setErroLista(err.response?.data?.erro || 'Não foi possível carregar os usuários.');
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar() {
    setErroNovo('');
    try {
      await api.post('/usuarios', novo);
      setModalNovoAberto(false);
      setNovo(vazioNovo);
      carregar();
    } catch (err: any) {
      setErroNovo(err.response?.data?.erro || 'Não foi possível criar o usuário.');
    }
  }

  function abrirEdicao(u: Usuario) {
    setEditando(u);
    setNomeEdicao(u.nome);
    setPerfilEdicao(u.perfil);
    setAtivoEdicao(u.ativo !== false);
    setErroEdicao('');
  }

  async function salvarEdicao() {
    if (!editando) return;
    setErroEdicao('');
    try {
      await api.put(`/usuarios/${editando.id}`, {
        nome: nomeEdicao,
        perfil: perfilEdicao,
        ativo: ativoEdicao,
      });
      setEditando(null);
      carregar();
    } catch (err: any) {
      setErroEdicao(err.response?.data?.erro || 'Não foi possível salvar as alterações.');
    }
  }

  function abrirRedefinirSenha(u: Usuario) {
    setRedefinindo(u);
    setNovaSenha('');
    setErroSenha('');
    setSucessoSenha('');
  }

  async function confirmarRedefinirSenha() {
    if (!redefinindo) return;
    setErroSenha('');
    setSucessoSenha('');
    try {
      await api.post(`/usuarios/${redefinindo.id}/redefinir-senha`, { novaSenha });
      setSucessoSenha('Senha redefinida com sucesso.');
      setNovaSenha('');
    } catch (err: any) {
      setErroSenha(err.response?.data?.erro || 'Não foi possível redefinir a senha.');
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setErroExclusao('');
    try {
      await api.delete(`/usuarios/${excluindo.id}`);
      setExcluindo(null);
      carregar();
    } catch (err: any) {
      setErroExclusao(err.response?.data?.erro || 'Não foi possível excluir o usuário.');
    }
  }

  return (
    <div>
      <h1 className="font-display text-[22px] font-extrabold text-texto mb-0.5">Usuários</h1>
      <p className="text-[12.5px] text-textoSuave mb-4">Quem pode acessar o sistema</p>

      <div className="flex justify-end mb-3.5">
        <button
          onClick={() => {
            setNovo(vazioNovo);
            setErroNovo('');
            setModalNovoAberto(true);
          }}
          className="bg-azul text-white font-bold text-[12.5px] rounded-lg px-4 py-2"
        >
          + Novo usuário
        </button>
      </div>

      {erroLista && <p className="text-alerta text-[12.5px] font-semibold mb-3">{erroLista}</p>}

      <div className="bg-white border border-linha rounded-2xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wide text-textoSuave font-bold border-b border-linha">
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4">Perfil</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-linha last:border-none">
                <td className="py-3 px-4">{u.nome}</td>
                <td className="py-3 px-4">{u.usuario}</td>
                <td className="py-3 px-4">{u.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Almoxarife'}</td>
                <td className="py-3 px-4">
                  {u.ativo === false ? (
                    <span className="text-alerta font-bold text-[11.5px]">● Inativo</span>
                  ) : (
                    <span className="text-ok font-bold text-[11.5px]">● Ativo</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button onClick={() => abrirEdicao(u)} className="text-[12px] font-semibold text-alerta mr-3">
                    Editar
                  </button>
                  <button onClick={() => abrirRedefinirSenha(u)} className="text-[12px] font-semibold text-textoSuave mr-3">
                    Redefinir senha
                  </button>
                  {u.id !== usuarioLogado?.id && (
                    <button onClick={() => { setExcluindo(u); setErroExclusao(''); }} className="text-[12px] font-semibold text-alerta">
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && !erroLista && (
              <tr>
                <td colSpan={5} className="py-4 px-3 text-center text-textoSuave">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: novo usuário */}
      {modalNovoAberto && (
        <div className="fixed inset-0 bg-marinho/40 flex items-center justify-center z-50" onClick={() => setModalNovoAberto(false)}>
          <div className="bg-white rounded-2xl p-6 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-extrabold text-base text-texto mb-4">Novo usuário</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Nome</label>
                <input className="w-full border border-linha rounded-lg px-3 py-2 text-sm" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Usuário (login)</label>
                <input className="w-full border border-linha rounded-lg px-3 py-2 text-sm" value={novo.usuario} onChange={(e) => setNovo({ ...novo, usuario: e.target.value })} />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Senha inicial</label>
                <input type="password" className="w-full border border-linha rounded-lg px-3 py-2 text-sm" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Perfil</label>
                <select
                  className="w-full border border-linha rounded-lg px-3 py-2 text-sm"
                  value={novo.perfil}
                  onChange={(e) => setNovo({ ...novo, perfil: e.target.value as any })}
                >
                  <option value="ALMOXARIFE">Almoxarife</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
            </div>
            {erroNovo && <p className="text-alerta text-[12px] font-semibold mt-3">{erroNovo}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalNovoAberto(false)} className="flex-1 border border-linha rounded-lg py-2 text-[12.5px] font-bold">
                Cancelar
              </button>
              <button onClick={criar} className="flex-1 bg-azul text-white rounded-lg py-2 text-[12.5px] font-bold">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: editar usuário */}
      {editando && (
        <div className="fixed inset-0 bg-marinho/40 flex items-center justify-center z-50" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl p-6 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-extrabold text-base text-texto mb-4">Editar usuário</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Nome</label>
                <input className="w-full border border-linha rounded-lg px-3 py-2 text-sm" value={nomeEdicao} onChange={(e) => setNomeEdicao(e.target.value)} />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Usuário (login)</label>
                <input className="w-full border border-linha rounded-lg px-3 py-2 text-sm bg-fundo text-textoSuave" value={editando.usuario} disabled />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Perfil</label>
                <select
                  className="w-full border border-linha rounded-lg px-3 py-2 text-sm"
                  value={perfilEdicao}
                  onChange={(e) => setPerfilEdicao(e.target.value as any)}
                >
                  <option value="ALMOXARIFE">Almoxarife</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-[12.5px] font-semibold text-textoSuave">
                <input type="checkbox" checked={ativoEdicao} onChange={(e) => setAtivoEdicao(e.target.checked)} />
                Usuário ativo (desmarque para bloquear o acesso sem excluir)
              </label>
            </div>
            {erroEdicao && <p className="text-alerta text-[12px] font-semibold mt-3">{erroEdicao}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditando(null)} className="flex-1 border border-linha rounded-lg py-2 text-[12.5px] font-bold">
                Cancelar
              </button>
              <button onClick={salvarEdicao} className="flex-1 bg-azul text-white rounded-lg py-2 text-[12.5px] font-bold">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: redefinir senha */}
      {redefinindo && (
        <div className="fixed inset-0 bg-marinho/40 flex items-center justify-center z-50" onClick={() => setRedefinindo(null)}>
          <div className="bg-white rounded-2xl p-6 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-extrabold text-base text-texto mb-1">Redefinir senha</h2>
            <p className="text-[12px] text-textoSuave mb-4">Usuário: {redefinindo.nome}</p>
            <div>
              <label className="text-[11.5px] font-bold text-textoSuave block mb-1">Nova senha</label>
              <input type="password" className="w-full border border-linha rounded-lg px-3 py-2 text-sm" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            </div>
            {erroSenha && <p className="text-alerta text-[12px] font-semibold mt-3">{erroSenha}</p>}
            {sucessoSenha && <p className="text-ok text-[12px] font-semibold mt-3">{sucessoSenha}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setRedefinindo(null)} className="flex-1 border border-linha rounded-lg py-2 text-[12.5px] font-bold">
                Fechar
              </button>
              <button onClick={confirmarRedefinirSenha} className="flex-1 bg-azul text-white rounded-lg py-2 text-[12.5px] font-bold">
                Redefinir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar exclusão */}
      {excluindo && (
        <div className="fixed inset-0 bg-marinho/40 flex items-center justify-center z-50" onClick={() => setExcluindo(null)}>
          <div className="bg-white rounded-2xl p-6 w-[360px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-extrabold text-base text-texto mb-2">Excluir usuário</h2>
            <p className="text-[12.5px] text-textoSuave mb-1">
              Tem certeza que deseja excluir <b>{excluindo.nome}</b>?
            </p>
            <p className="text-[11.5px] text-textoSuave mb-4">
              Se esse usuário já tiver movimentações registradas, ele será apenas inativado (para preservar o histórico), não excluído de fato.
            </p>
            {erroExclusao && <p className="text-alerta text-[12px] font-semibold mb-3">{erroExclusao}</p>}
            <div className="flex gap-2">
              <button onClick={() => setExcluindo(null)} className="flex-1 border border-linha rounded-lg py-2 text-[12.5px] font-bold">
                Cancelar
              </button>
              <button onClick={confirmarExclusao} className="flex-1 bg-azul text-white rounded-lg py-2 text-[12.5px] font-bold">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
