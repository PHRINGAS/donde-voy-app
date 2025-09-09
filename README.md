# Donde Voy? 🗺️

An interactive web application that helps you discover markets, fairs, and cultural spaces near your location in Buenos Aires.

## ✨ Key Features

### 🎯 Map Functionalities
- **10 nearest points**: Automatically displays the 10 places closest to your location.
- **Dynamic markers**: Markers enlarge on hover.
- **Real-time updates**: Markers update according to the selected filters.
- **Smooth visual effects**: Fluid transitions and consistent hover effects.

### 🏷️ Filtering System
- **3 main categories**:
  - 🛒 **Markets**: Municipal markets and supply centers.
  - 🎪 **Fairs**: Artisan, book, antique fairs, and more.
  - 🎭 **Culture**: Theaters, museums, cultural centers, historical bars.

### 📍 Smart Geolocation
- Automatic location detection.
- Real-time distance calculation.
- Address search.
- Detailed information for each point.

### 🎨 Modern Interface
- Responsive and fluid design.
- Smooth transitions between states.
- Visual consistency across all elements.
- Intuitive and easy-to-use interface.

## 🚀 Technologies Used

- **Frontend**: React 18 + TypeScript
- **Maps**: Leaflet.js
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + Local Storage
- **Geolocation**: Web Geolocation API
- **Data**: CSV + JSON + Supabase (optional)

## 🚧 Project Status: Migration in Progress

"Donde Voy" is currently undergoing a migration to expand its scope. We are in the process of integrating a wider variety of locations, including **restaurants** and other interesting places recommended by **TikTok influencers**. This will allow you to discover not only cultural spots but also the trendiest places to eat and visit.

## 📊 Data Sources

The application integrates and processes data from multiple sources:

1.  **mercados.csv**: Municipal markets of Buenos Aires.
2.  **ferias.csv**: Artisan and cultural fairs.
3.  **espacios-culturales.json**: Theaters, museums, historical bars.
4.  **Existing data**: Local fairs and GeoJSON.

## 🛠️ Installation and Usage

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd donde-voy-app

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Available Scripts
```bash
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Production preview
npm run lint         # Linting
```

## 🎯 Specific Functionalities

### Interactive Map
- **Dynamic zoom**: Markers change size with zoom level.
- **Color legend**: Visual identification by categories.
- **Informative popups**: Detailed information for each place.
- **Automatic centering**: Centers on your location.

### Advanced Filters
- **By category**: Markets, Fairs, Culture.
- **By type**: Specific to each category.
- **By distance**: Customizable search radius.
- **By hours**: Morning, afternoon, night, all day.
-- **By services**: WiFi, parking, accessibility, etc.

### Personal Management
- **Favorites**: Save your favorite places.
- **Search**: Find places by name or address.
- **Reminders**: Notification system (in development).

## 📱 Responsive Design

The application is optimized for:
- 📱 Mobiles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)

## 🎨 Color Palette

- **Markets**: Blue (#4ECDC4)
- **Fairs**: Orange (#FF6B6B)
- **Culture**: Purple (#9B59B6)
- **User**: Navy Blue (#007cbf)

## 🔧 Advanced Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Data Customization
Data files are located in the project root:
- `mercados.csv`: CSV format with specific columns.
- `ferias.csv`: Fair data in CSV format.
- `espacios-culturales.json`: JSON data for cultural spaces.

## 🤝 Contribution

1.  Fork the project.
2.  Create a branch for your feature (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is under the MIT License. See the `LICENSE` file for more details.

## 🙏 Acknowledgements

- Market and fair data provided by the Government of the City of Buenos Aires.
- Icons by Lucide React.
- UI Components by shadcn/ui.
- Maps by OpenStreetMap.

## 📞 Contact

Have questions or suggestions? Feel free to contact us!

---

**Donde Voy?** - Discover Buenos Aires in a new way 🗺️✨
