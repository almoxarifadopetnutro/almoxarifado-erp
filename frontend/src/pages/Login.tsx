import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(usuario, senha);
      navigate('/');
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme px-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E8E0D2] rounded-2xl px-9 py-10 w-[320px] text-center"
      >
        <div className="w-[52px] h-[52px] rounded-2xl bg-vermelho text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-3.5">
          A
        </div>
        <h1 className="text-base font-extrabold mb-0.5">Almoxarifado</h1>
        <p className="text-[11.5px] text-[#6B6259] font-bold uppercase tracking-wide mb-6">Pet's Kitchen</p>

        <div className="text-left mb-3">
          <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Usuário</label>
          <input
            className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoFocus
          />
        </div>
        <div className="text-left mb-3">
          <label className="text-[11.5px] font-bold text-[#6B6259] block mb-1">Senha</label>
          <input
            type="password"
            className="w-full border border-[#E8E0D2] rounded-lg px-3 py-2 text-sm"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro && <p className="text-vermelho text-[12px] font-semibold mb-2">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-vermelho text-white font-bold text-sm rounded-lg py-2.5 mt-2 disabled:opacity-60"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
