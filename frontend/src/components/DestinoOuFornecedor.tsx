import { Movimentacao } from '../types';

/** Mostra o setor (saídas) ou o fornecedor (entradas) com uma etiqueta indicando qual dos dois é. */
export function DestinoOuFornecedor({ m }: { m: Movimentacao }) {
  const ehEntrada = m.tipo === 'ENTRADA';
  const valor = ehEntrada ? m.fornecedor : m.setorDestino;

  // Entrada gerada pelo "Estoque inicial" do cadastro do material
  if (ehEntrada && !valor && m.observacao === 'Estoque inicial') {
    return (
      <span className="inline-block text-[9.5px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 bg-azulClaro text-azul">
        Estoque inicial
      </span>
    );
  }

  if (!valor) return <>—</>;
  return (
    <>
      <span
        className={`inline-block text-[9.5px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 mr-1.5 align-[1px] ${
          ehEntrada ? 'bg-okClaro text-ok' : 'bg-fundo text-textoSuave border border-linha'
        }`}
      >
        {ehEntrada ? 'Forn.' : 'Setor'}
      </span>
      <span className="text-texto">{valor}</span>
    </>
  );
}
