/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        marinho: '#0F2A4A',    // navegação, texto de maior peso
        azul: '#2F6FEE',       // ações primárias, destaque
        azulClaro: '#EAF1FE',  // fundos suaves, badges
        fundo: '#F5F8FC',      // fundo geral da aplicação
        linha: '#E1E8F0',      // bordas
        texto: '#101B2D',      // texto principal
        textoSuave: '#5B6B84', // texto secundário
        // status funcional de estoque (não é cor de marca)
        ok: '#16A34A',
        okClaro: '#E7F7EC',
        alerta: '#DC2626',
        alertaClaro: '#FDECEC',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
