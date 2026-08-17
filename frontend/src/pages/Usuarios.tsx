import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Usuario } from '../types';

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<'ADMINISTRADOR' | 'ALMOXARIFE'>('ALMOXARIFE');
  const [erro, setErro] = useState('');

  async function carregar() {
    const { data } = await api.get('/usuarios');
    setUsuarios(data);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar() {
    setErro('');
    try {
      await api.post('/usuarios', { nome, usuario: usuarioLogin, senha, perfil });
      setModalAberto(false);
      setNome('');
      setUsuarioLogin('');
      setSenha('');
      setPerfil('ALMOXARIFE');
      carregar();
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Não foi possível criar o usuário.');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-extrabold mb-0.5">Usuários</h1>
      <p className="text-[12.5px] text-[#6B6259] mb-4">Quem pode acessar o sistema</p>

      <div className="flex justify-end mb-3.5">
        <button
          onClick={() => setModalAberto(true)}
          className="bg-vermelho text-white font-bold text-[12.5px] rounded-lg px-4 py-2"
        >
          + Novo usuário
        </button>
      </div>

      <div className="bg-white border border-[#E8E0D2] rounded-xl overflow-hidden">
        <table className="w-full text-[12.8px]">
          <thead>
            <tr className="text-left text-[10.5px] uppercase text-[#6B6259] border-b border-[#E8E0D2]">
              <th className="py-2.5 px-3">Nome</th>
              <th className="py-2.5 px-3">Usuário</th>
              <th className="py-2.5 px-3">Perfil</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-[#E8E0D2] last:border-none">
                <td className="py-2.5 px-3">{u.nome}</td>
                <td className="py-2.5 px-3">{u.usuario}</td>
                <td className="py-2.5 px-3">{u.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Almoxarife'}</td>
                <td className="py-2.5 px-3">{u.ativo === false ? 'Inativo' : 'Ativo'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setModalAberto(false)}>
          <div className="bg-white rounded-2xl p-6 w-[380px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-extrabold text-base mb-4">Novo usuário</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Nome</label>
                <input className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Usuário (login)</label>
                <input className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm" value={usuarioLogin} onChange={(e) => setUsuarioLogin(e.target.value)} />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Senha inicial</label>
                <input type="password" className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
              <div>
                <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Perfil</label>
                <select
                  className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as any)}
                >
                  <option value="ALMOXARIFE">Almoxarife</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
            </div>
            {erro && <p className="text-vermelho text-[12px] font-semibold mt-3">{erro}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalAberto(false)} className="flex-1 border border-[#E8E0D2] rounded-lg py-2 text-[12.5px] font-bold">
                Cancelar
              </button>
              <button onClick={criar} className="flex-1 bg-vermelho text-white rounded-lg py-2 text-[12.5px] font-bold">
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
