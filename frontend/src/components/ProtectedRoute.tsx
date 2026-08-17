import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({
  children,
  apenasAdmin = false,
}: {
  children: JSX.Element;
  apenasAdmin?: boolean;
}) {
  const { usuario, carregandoSessao } = useAuth();

  if (carregandoSessao) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (apenasAdmin && usuario.perfil !== 'ADMINISTRADOR') return <Navigate to="/" replace />;

  return children;
}
