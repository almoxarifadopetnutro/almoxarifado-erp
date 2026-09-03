import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function IconArmazem({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10.5 12 4l10 6.5" />
      <path d="M4 9.5V21h16V9.5" />
      <path d="M9 21v-6h6v6" />
      <path d="M9 17h6" />
      <path d="M9 19h6" />
    </svg>
  );
}

function IconUsuario({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function IconCadeado({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
    </svg>
  );
}

function IconSeta({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

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
    <div className="min-h-screen flex bg-white">
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-marinho flex-col justify-between p-14"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.08) 1.5px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-azul/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-azul/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-azul text-white flex items-center justify-center flex-shrink-0">
            <IconArmazem size={20} />
          </div>
          <span className="font-display font-extrabold text-white text-sm tracking-wide">NUTROPET</span>
        </div>

        <div className="relative">
          <h1 className="font-display text-3xl font-extrabold text-white">Almoxarifado</h1>
        </div>

        <svg
          className="absolute right-0 bottom-0 w-[280px] h-[280px] opacity-90 pointer-events-none"
          viewBox="0 0 300 300"
          fill="none"
        >
          <g opacity="0.5" stroke="#4b73d8" strokeWidth="1.4">
            <rect x="40" y="170" width="70" height="70" rx="4" />
            <rect x="115" y="150" width="70" height="90" rx="4" />
            <rect x="190" y="185" width="60" height="55" rx="4" />
            <line x1="40" y1="205" x2="110" y2="205" />
            <line x1="115" y1="195" x2="185" y2="195" />
          </g>
          <g opacity="0.85" stroke="#7a97e6" strokeWidth="1.6">
            <rect x="60" y="110" width="55" height="55" rx="4" />
            <line x1="60" y1="137" x2="115" y2="137" />
            <line x1="87" y1="110" x2="87" y2="165" />
          </g>
        </svg>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-[340px]">
          <div className="w-14 h-14 rounded-2xl bg-azul/10 text-azul flex items-center justify-center mx-auto mb-8">
            <IconArmazem size={26} />
          </div>

          <div className="text-left mb-3.5">
            <label className="text-[11.5px] font-bold text-textoSuave block mb-1.5">Usuário</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textoSuave pointer-events-none">
                <IconUsuario size={16} />
              </span>
              <input
                className="w-full border border-linha rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15 transition"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="text-left mb-3.5">
            <label className="text-[11.5px] font-bold text-textoSuave block mb-1.5">Senha</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textoSuave pointer-events-none">
                <IconCadeado size={16} />
              </span>
              <input
                type="password"
                className="w-full border border-linha rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15 transition"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-1 mt-1">
            <label className="flex items-center gap-2 text-[12.5px] text-textoSuave">
              <input type="checkbox" className="rounded border-linha" />
              Lembrar de mim
            </label>
            <button type="button" className="text-[12.5px] font-bold text-azul hover:underline">
              Esqueci a senha
            </button>
          </div>

          {erro && <p className="text-alerta text-[12px] font-semibold mt-2 mb-1">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-azul hover:bg-[#2660D6] transition-colors text-white font-bold text-sm rounded-lg py-2.75 mt-5 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {carregando ? 'Entrando...' : (
              <>
                Entrar <IconSeta size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
