import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkBase =
  'block px-3 py-2.5 mb-0.5 rounded-lg text-[13px] font-semibold text-[#6B6259] hover:bg-creme transition-colors';
const linkOn = 'bg-vermelho text-white hover:bg-vermelho';

export function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-creme">
      <aside className="w-[190px] shrink-0 bg-white border-r border-[#E8E0D2] p-4 flex flex-col">
        <div className="flex items-center gap-2.5 px-1 mb-8">
          <div className="w-8 h-8 rounded-lg bg-vermelho flex items-center justify-center text-white font-extrabold text-sm">
            A
          </div>
          <div>
            <div className="font-extrabold text-sm leading-none">Almoxarifado</div>
            <div className="text-[10px] font-semibold text-[#6B6259] uppercase tracking-wide">
              Pet's Kitchen
            </div>
          </div>
        </div>

        <nav className="flex-1">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkOn : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/materiais" className={({ isActive }) => `${linkBase} ${isActive ? linkOn : ''}`}>
            Materiais
          </NavLink>
          <NavLink to="/movimentacoes" className={({ isActive }) => `${linkBase} ${isActive ? linkOn : ''}`}>
            Movimentações
          </NavLink>
          <NavLink to="/relatorios" className={({ isActive }) => `${linkBase} ${isActive ? linkOn : ''}`}>
            Relatórios
          </NavLink>
          {usuario?.perfil === 'ADMINISTRADOR' && (
            <NavLink to="/usuarios" className={({ isActive }) => `${linkBase} ${isActive ? linkOn : ''}`}>
              Usuários
            </NavLink>
          )}
        </nav>

        <button
          onClick={logout}
          className="text-[12.5px] font-semibold text-[#6B6259] hover:text-vermelho text-left px-3 py-2"
        >
          Sair
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#E8E0D2]">
          <div />
          <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#6B6259]">
            <div className="w-6 h-6 rounded-full bg-amarelo" />
            {usuario?.nome} · <span className="text-vermelho">{usuario?.perfil}</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
