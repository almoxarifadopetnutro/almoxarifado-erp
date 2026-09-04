import { useMemo, useRef, useState } from 'react';
import { Material } from '../types';

interface SeletorMaterialProps {
  materiais: Material[];
  value: string;
  onChange: (materialId: string) => void;
}

export function SeletorMaterial({ materiais, value, onChange }: SeletorMaterialProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selecionado = materiais.find((m) => m.id === value);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return materiais;
    return materiais.filter((m) => m.nome.toLowerCase().includes(termo));
  }, [materiais, busca]);

  function selecionar(m: Material) {
    onChange(m.id);
    setBusca('');
    setAberto(false);
    inputRef.current?.blur();
  }

  const textoExibido = selecionado ? `${selecionado.nome} — saldo atual: ${selecionado.estoqueAtual} ${selecionado.unidade}` : '';

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
        value={aberto ? busca : textoExibido}
        onFocus={() => {
          setAberto(true);
          setBusca('');
        }}
        onChange={(e) => setBusca(e.target.value)}
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        placeholder="Digite para pesquisar um material..."
        autoComplete="off"
      />

      {aberto && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-linha rounded-lg shadow-lg">
          {filtrados.length === 0 ? (
            <div className="px-3 py-2.5 text-[12.5px] text-textoSuave">Nenhum material encontrado</div>
          ) : (
            filtrados.map((m) => (
              <div
                key={m.id}
                onMouseDown={() => selecionar(m)}
                className={`px-3 py-2.5 text-[12.8px] cursor-pointer hover:bg-fundo ${
                  m.id === value ? 'bg-azul/10 text-azul font-semibold' : 'text-texto'
                }`}
              >
                {m.nome} — saldo atual: {m.estoqueAtual} {m.unidade}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
