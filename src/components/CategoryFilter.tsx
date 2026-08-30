import React from 'react';
import { useApp } from '../contexts/AppContext';
import { CATEGORIAS_PRINCIPALES } from '../types';

const filterTypes = [
    { id: 'Todos', label: 'Todos', icon: '📍' },
    { id: 'Gastronomía', label: 'Gastronomía', icon: '🍽️' },
    { id: 'Bares', label: 'Bares', icon: '🍺' },
    { id: 'Cultura', label: 'Cultura', icon: '🎭' },
    { id: 'Actividades', label: 'Actividades', icon: '🎯' },
    { id: 'Noche', label: 'Noche', icon: '🌙' },
    { id: 'Mercados', label: 'Mercados', icon: '🛒' },
    { id: 'Ferias', label: 'Ferias', icon: '🎪' },
];

const CategoryFilter: React.FC = () => {
    const { searchFilters, setSearchFilters, ferias } = useApp();

    // ARREGLA EL BUG DEL CONTADOR VEGANO
    const getCategoryCount = (category: string) => {
        if (category === 'Todos') return ferias.length;

        // Para categorías principales
        if (CATEGORIAS_PRINCIPALES.includes(category)) {
            return ferias.filter(feria => feria.categoria === category).length;
        }
        
        // Para especialidades como Orgánico y Vegano
        return ferias.filter(feria => 
            feria.especialidad.some(esp => esp.toLowerCase().includes(category.toLowerCase())) ||
            feria.etiquetas.some(tag => tag.toLowerCase().includes(category.toLowerCase())) ||
            feria.productos.some(prod => prod.toLowerCase().includes(category.toLowerCase()))
        ).length;
    };

    const handleCategoryChange = (category: string) => {
        setSearchFilters({
            ...searchFilters,
            categoria: category === 'Todos' ? undefined : category
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            {/* TÍTULO CON JERARQUÍA MEJORADA */}
            <h3 className="category-filter-title">¿Qué buscas?</h3>

            <div className="filter-grid">
                {filterTypes.map((filter) => {
                    const isActive = searchFilters.categoria === filter.id ||
                        (!searchFilters.categoria && filter.id === 'Todos');
                    const count = getCategoryCount(filter.id);

                    return (
                        <button
                            key={filter.id}
                            className={`filter-chip ${isActive ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(filter.id)}
                        >
                            <span>{filter.icon}</span>
                            <span>{filter.label}</span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full ml-2">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryFilter;