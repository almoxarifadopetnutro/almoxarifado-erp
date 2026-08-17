import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { Usuario } from '../types';

interface AuthContextData {
  usuario: Usuario | null;
  carregandoSessao: boolean;
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem('almoxarifado_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  // carregandoSessao evita "logout falso" durante o F5, igual ao PCP ERP
  const [carregandoSessao] = useState(false);

  async function login(usuarioLogin: string, senha: string) {
    const { data } = await api.post('/auth/login', { usuario: usuarioLogin, senha });
    localStorage.setItem('almoxarifado_token', data.token);
    localStorage.setItem('almoxarifado_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem('almoxarifado_token');
    localStorage.removeItem('almoxarifado_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregandoSessao, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
