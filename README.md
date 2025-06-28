# Feria Finder Urbana App

Una aplicación para encontrar y explorar ferias urbanas en la Ciudad de Buenos Aires.

## Características

- 🗺️ Mapa interactivo con ubicaciones de ferias
- 🔍 Búsqueda y filtros avanzados
- ❤️ Sistema de favoritos
- 📍 Geolocalización y cálculo de distancias
- 📱 Diseño responsive
- 🗄️ Base de datos en Supabase

## Datos de Ferias

La aplicación incluye datos de ferias de dos fuentes:

1. **Datos de muestra**: Ferias populares de Buenos Aires
2. **Datos del archivo GeoJSON**: Ferias Itinerantes de Abastecimiento Barrial (FIAB) del gobierno de la Ciudad

### Sincronización con Supabase

Para sincronizar los datos del archivo `ferias_geo.json` con la base de datos de Supabase:

1. **Configurar Supabase**:
   - Asegúrate de que el proyecto de Supabase esté configurado
   - Ejecuta la migración para crear la tabla `ferias`:
   ```bash
   supabase db push
   ```

2. **Sincronizar datos**:
   ```bash
   npm run sync-ferias
   ```

Este comando:
- Carga los datos del archivo `ferias_geo.json`
- Los procesa y convierte al formato de la aplicación
- Los sincroniza con la base de datos de Supabase
- Muestra estadísticas del proceso

### Estructura de Datos

Los datos se procesan y normalizan para incluir:

- **Información básica**: Nombre, dirección, coordenadas
- **Horarios**: Días de funcionamiento y horarios de apertura/cierre
- **Productos**: Tipos de productos disponibles
- **Clasificación**: Tipo de feria (Mercado, Artesanías, etc.)
- **Ubicación**: Barrio y comuna

## Desarrollo

### Instalación

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

### Construir para producción

```bash
npm run build
```

## Tecnologías

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Mapas**: Leaflet
- **Base de datos**: Supabase
- **Estado**: React Context + localStorage

## Estructura del Proyecto

```
src/
├── components/          # Componentes de UI
├── contexts/           # Contextos de React
├── data/              # Datos y procesamiento
├── hooks/             # Hooks personalizados
├── integrations/      # Integraciones (Supabase)
├── pages/             # Páginas de la aplicación
├── types/             # Tipos TypeScript
├── utils/             # Utilidades
└── main.tsx           # Punto de entrada
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.
