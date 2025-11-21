/**
 * Sistema de Diseño - CAB App
 * Configuración centralizada de colores, tipografía y estilos
 */

export const theme = {
  // Paleta de colores principal
  colors: {
    // Colores primarios
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Principal
      600: '#2563EB', // Hover/Active
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },

    // Colores secundarios
    secondary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5', // Principal
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },

    // Colores semánticos
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981', // Principal
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },

    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Principal
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },

    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444', // Principal
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },

    // Colores neutros
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  // Tipografía
  typography: {
    fontFamily: {
      sans: '"Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Arial", sans-serif',
      mono: '"Fira Code", "Consolas", "Monaco", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Espaciado
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
  },

  // Bordes redondeados
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Sombras
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  // Transiciones
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Breakpoints para responsive
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Clases CSS utilitarias comunes
export const commonStyles = {
  // Botones
  button: {
    base: `inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`,
    primary: `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`,
    secondary: `bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400`,
    success: `bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`,
    danger: `bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`,
    ghost: `bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500`,
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    },
  },

  // Inputs
  input: {
    base: `w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed`,
    error: `border-red-300 focus:border-red-500 focus:ring-red-200`,
  },

  // Cards
  card: {
    base: `bg-white rounded-lg shadow-md overflow-hidden`,
    hover: `bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg`,
  },

  // Badges
  badge: {
    base: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`,
    success: `bg-green-100 text-green-800`,
    warning: `bg-orange-100 text-orange-800`,
    error: `bg-red-100 text-red-800`,
    info: `bg-blue-100 text-blue-800`,
  },
};

export default theme;
