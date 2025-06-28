# Donde voy? 🗺️

Una aplicación web interactiva que te ayuda a descubrir mercados, ferias y espacios culturales cerca de tu ubicación en Buenos Aires.

## ✨ Características Principales

### 🎯 Funcionalidades del Mapa
- **10 puntos más cercanos**: Muestra automáticamente los 10 lugares más cercanos a tu ubicación
- **Marcadores dinámicos**: Los marcadores se agrandan al pasar el mouse (efecto hover)
- **Actualización en tiempo real**: Los marcadores se actualizan según los filtros seleccionados
- **Efectos visuales suaves**: Transiciones fluidas y efectos hover consistentes

### 🏷️ Sistema de Filtrado
- **3 categorías principales**:
  - 🛒 **Mercados**: Mercados municipales y centros de abastecimiento
  - 🎪 **Ferias**: Ferias artesanales, de libros, antigüedades y más
  - 🎭 **Cultura**: Teatros, museos, centros culturales, bares históricos

### 📍 Geolocalización Inteligente
- Detección automática de ubicación
- Cálculo de distancias en tiempo real
- Búsqueda de direcciones
- Información detallada de cada punto

### 🎨 Interfaz Moderna
- Diseño responsivo y fluido
- Transiciones suaves entre estados
- Consistencia visual en todos los elementos
- Interfaz intuitiva y fácil de usar

## 🚀 Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Mapas**: Leaflet.js
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: React Context + Local Storage
- **Geolocalización**: Web Geolocation API
- **Datos**: CSV + JSON + Supabase (opcional)

## 📊 Fuentes de Datos

La aplicación integra y procesa datos de múltiples fuentes:

1. **mercados.csv**: Mercados municipales de Buenos Aires
2. **ferias.csv**: Ferias artesanales y culturales
3. **espacios-culturales.json**: Teatros, museos, bares históricos
4. **Datos existentes**: Ferias locales y GeoJSON

## 🛠️ Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd feria-finder-urbana-app

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de producción
npm run lint         # Linting
```

## 🎯 Funcionalidades Específicas

### Mapa Interactivo
- **Zoom dinámico**: Los marcadores cambian de tamaño según el zoom
- **Leyenda de colores**: Identificación visual por categorías
- **Popups informativos**: Información detallada de cada lugar
- **Centrado automático**: Se centra en tu ubicación

### Filtros Avanzados
- **Por categoría**: Mercados, Ferias, Cultura
- **Por tipo**: Específico de cada categoría
- **Por distancia**: Radio de búsqueda personalizable
- **Por horarios**: Mañana, tarde, noche, todo el día
- **Por servicios**: WiFi, estacionamiento, accesibilidad, etc.

### Gestión Personal
- **Favoritos**: Guarda tus lugares preferidos
- **Búsqueda**: Encuentra lugares por nombre o dirección
- **Recordatorios**: Sistema de notificaciones (en desarrollo)

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)

## 🎨 Paleta de Colores

- **Mercados**: Azul (#4ECDC4)
- **Ferias**: Naranja (#FF6B6B)
- **Cultura**: Púrpura (#9B59B6)
- **Usuario**: Azul marino (#007cbf)

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Personalización de Datos
Los archivos de datos se encuentran en la raíz del proyecto:
- `mercados.csv`: Formato CSV con columnas específicas
- `ferias.csv`: Datos de ferias en formato CSV
- `espacios-culturales.json`: Datos JSON de espacios culturales

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Datos de mercados y ferias proporcionados por el Gobierno de la Ciudad de Buenos Aires
- Iconos de Lucide React
- Componentes UI de shadcn/ui
- Mapas de OpenStreetMap

## 📞 Contacto

¿Tienes preguntas o sugerencias? ¡No dudes en contactarnos!

---

**Donde voy?** - Descubre Buenos Aires de una manera nueva 🗺️✨
