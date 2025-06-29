import React from 'react';
import { useApp } from '../contexts/AppContext';

const CategoryFilter: React.FC = () => {
    const { searchFilters, setSearchFilters, ferias } = useApp();

    const filterTypes = [
        { id: 'Todos', label: 'Todos', icon: '📍' },
        { id: 'Mercados', label: 'Mercados', icon: '🛒' },
        { id: 'Ferias', label: 'Ferias', icon: '🎪' },
        { id: 'Cultura', label: 'Cultura', icon: '🎭' },
        { id: 'Orgánico', label: 'Orgánico', icon: '🌱' },
        { id: 'Vegano', label: 'Vegano', icon: '🥗' }
    ];

    const getCategoryCount = (category: string) => {
        if (category === 'Todos') return ferias.length;
        return ferias.filter(feria => 
            feria.categoria === category || 
            feria.especialidad.some(esp => esp.toLowerCase().includes(category.toLowerCase()))
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
            <h3 className="text-sm font-bold text-gray-800 mb-3">¿Qué buscas?</h3>

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