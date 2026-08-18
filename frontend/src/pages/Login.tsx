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
    <div
      className="min-h-screen flex items-center justify-center bg-marinho px-6 relative overflow-hidden"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.08) 1.5px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-azul/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-azul/10 blur-3xl" />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white border border-linha rounded-2xl px-9 py-10 w-[340px] shadow-2xl shadow-black/20"
      >
        <div className="w-[52px] h-[52px] rounded-2xl bg-azul text-white font-display font-extrabold text-xl flex items-center justify-center mb-5">
          A
        </div>
        <h1 className="font-display text-xl font-extrabold text-texto mb-0.5">Almoxarifado</h1>
        <p className="text-[11.5px] text-textoSuave font-bold uppercase tracking-wide mb-7">Pet's Kitchen</p>

        <div className="text-left mb-3.5">
          <label className="text-[11.5px] font-bold text-textoSuave block mb-1.5">Usuário</label>
          <input
            className="w-full border border-linha rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15 transition"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoFocus
          />
        </div>
        <div className="text-left mb-3.5">
          <label className="text-[11.5px] font-bold text-textoSuave block mb-1.5">Senha</label>
          <input
            type="password"
            className="w-full border border-linha rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15 transition"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro && <p className="text-alerta text-[12px] font-semibold mb-2">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-azul hover:bg-[#2660D6] transition-colors text-white font-bold text-sm rounded-lg py-2.75 mt-3 disabled:opacity-60"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
