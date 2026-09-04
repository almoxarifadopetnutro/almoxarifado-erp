import { useMemo, useRef, useState } from 'react';

interface SeletorTextoProps {
  opcoes: string[];
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

export function SeletorTexto({ opcoes, value, onChange, placeholder }: SeletorTextoProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return opcoes;
    return opcoes.filter((o) => o.toLowerCase().includes(termo));
  }, [opcoes, busca]);

  function selecionar(opcao: string) {
    onChange(opcao);
    setBusca('');
    setAberto(false);
    inputRef.current?.blur();
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="w-full border border-linha rounded-lg px-3 py-2 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/15"
        value={aberto ? busca : value}
        onFocus={() => {
          setAberto(true);
          setBusca('');
        }}
        onChange={(e) => {
          setBusca(e.target.value);
          onChange(e.target.value); // permite digitar um valor livre, mesmo fora da lista
        }}
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {aberto && filtradas.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-linha rounded-lg shadow-lg">
          {filtradas.map((opcao) => (
            <div
              key={opcao}
              onMouseDown={() => selecionar(opcao)}
              className={`px-3 py-2.5 text-[12.8px] cursor-pointer hover:bg-fundo ${
                opcao === value ? 'bg-azul/10 text-azul font-semibold' : 'text-texto'
              }`}
            >
              {opcao}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
