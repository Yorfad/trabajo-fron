/**
 * Configuración global de estilos responsivos
 * Sistema de diseño estandarizado para toda la aplicación
 */

export const responsive = {
  // Contenedores principales
  container: {
    // Contenedor con padding responsive
    main: 'min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6',
    // Contenedor centrado con max-width
    centered: 'mx-auto max-w-7xl',
    // Contenedor de formularios
    form: 'mx-auto max-w-4xl',
  },

  // Tarjetas (Cards)
  card: {
    base: 'rounded-lg bg-white shadow-md',
    padding: 'p-4 sm:p-6',
    spacing: 'mb-4 sm:mb-6',
  },

  // Grids responsive
  grid: {
    // Grid de 1 a 2 columnas
    cols2: 'grid grid-cols-1 gap-4 sm:grid-cols-2',
    // Grid de 1 a 3 columnas
    cols3: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
    // Grid de 1 a 4 columnas
    cols4: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
    // Grid de 1 a 5 columnas (para filtros)
    cols5: 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  },

  // Textos
  text: {
    // Títulos principales
    h1: 'text-2xl font-bold text-gray-800 sm:text-3xl',
    h2: 'text-xl font-semibold text-gray-800 sm:text-2xl',
    h3: 'text-lg font-semibold text-gray-700 sm:text-xl',
    // Párrafos
    body: 'text-sm text-gray-600 sm:text-base',
    small: 'text-xs text-gray-500 sm:text-sm',
  },

  // Botones
  button: {
    // Botón base responsive
    base: 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 sm:text-base',
    // Botón primario
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    // Botón secundario
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
    // Botón peligro
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    // Botón éxito
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
    // Botón icono solo (circular)
    icon: 'flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10',
  },

  // Inputs y formularios
  input: {
    base: 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:text-base',
    label: 'mb-1 block text-sm font-medium text-gray-700 sm:mb-2',
    error: 'mt-1 text-xs text-red-600 sm:text-sm',
    help: 'mt-1 text-xs text-gray-500 sm:text-sm',
  },

  // Tablas responsive
  table: {
    // Contenedor de tabla con scroll horizontal en móvil
    wrapper: 'overflow-x-auto rounded-lg shadow',
    // Tabla base
    table: 'min-w-full divide-y divide-gray-200',
    // Header de tabla
    th: 'px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-4 sm:py-3',
    // Celdas de tabla
    td: 'px-3 py-3 text-sm text-gray-900 sm:px-4 sm:py-4',
  },

  // Navegación y headers
  header: {
    // Header principal con flexbox responsive
    main: 'mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between',
    // Header secundario
    secondary: 'mb-3 flex items-center justify-between sm:mb-4',
  },

  // Badges y etiquetas
  badge: {
    base: 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium sm:px-2.5 sm:py-0.5 sm:text-sm',
  },

  // Espaciados comunes
  spacing: {
    section: 'mb-4 sm:mb-6',
    element: 'mb-3 sm:mb-4',
  },

  // Modales
  modal: {
    overlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4',
    content: 'w-full max-w-md rounded-lg bg-white p-4 shadow-xl sm:max-w-lg sm:p-6',
  },

  // Alertas
  alert: {
    base: 'rounded-lg p-3 text-sm sm:p-4 sm:text-base',
    success: 'border border-green-200 bg-green-50 text-green-800',
    error: 'border border-red-200 bg-red-50 text-red-800',
    warning: 'border border-orange-200 bg-orange-50 text-orange-800',
    info: 'border border-blue-200 bg-blue-50 text-blue-800',
  },
};

export default responsive;
