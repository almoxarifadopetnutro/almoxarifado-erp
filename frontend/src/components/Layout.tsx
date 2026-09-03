import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkBase =
  'flex items-center gap-2.5 px-3 py-2.5 mb-0.5 rounded-lg text-[13px] font-semibold text-[#A9BBD6] hover:bg-white/5 hover:text-white transition-colors';
const linkOn = 'bg-azul text-white hover:bg-azul hover:text-white';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/estoque', label: 'Estoque' },
  { to: '/movimentacoes', label: 'Movimentações' },
  { to: '/relatorios', label: 'Relatórios' },
];

export function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-fundo">
      <aside className="w-[200px] shrink-0 bg-marinho p-4 flex flex-col">
        <div className="flex items-center gap-2.5 px-1 mb-8 mt-1">
          <div className="w-8 h-8 rounded-lg bg-azul flex items-center justify-center text-white flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
              <path d="M3 8l9 5 9-5" />
              <path d="M12 13v8" />
            </svg>
          </div>
          <div>
            <div className="font-display font-extrabold text-sm leading-none text-white">Almoxarifado</div>
          </div>
        </div>

        <nav className="flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${linkBase} ${isActive ? linkOn : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          {usuario?.perfil === 'ADMINISTRADOR' && (
            <NavLink to="/usuarios" className={({ isActive }) => `${linkBase} ${isActive ? linkOn : ''}`}>
              Usuários
            </NavLink>
          )}
        </nav>

        <div className="border-t border-white/10 pt-3 mt-2">
          <div className="px-3 mb-2">
            <div className="text-[12.5px] font-semibold text-white truncate">{usuario?.nome}</div>
            <div className="text-[10.5px] font-bold text-azul uppercase tracking-wide">{usuario?.perfil}</div>
          </div>
          <button
            onClick={logout}
            className="text-[12.5px] font-semibold text-[#A9BBD6] hover:text-white text-left px-3 py-1.5"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-7 max-w-[1400px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
