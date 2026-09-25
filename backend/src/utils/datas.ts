/** Observação usada para marcar a Entrada criada a partir do "Estoque inicial" do cadastro. */
export const OBS_ESTOQUE_INICIAL = 'Estoque inicial';

/**
 * Data (AAAA-MM-DD) de um instante no fuso de São Paulo.
 * Ex.: 2026-09-09T23:43Z → "2026-09-09" (20:43 em Brasília), e não o dia 10.
 */
export function dataSaoPaulo(instante: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);
}

/**
 * Converte "AAAA-MM-DD" em Date ao meio-dia — mesmo padrão usado nas movimentações,
 * para que o fuso horário nunca empurre a data para o dia anterior.
 */
export function meioDia(dataISO: string): Date {
  const [ano, mes, dia] = dataISO.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12, 0, 0);
}
