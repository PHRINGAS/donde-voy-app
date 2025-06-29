import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const CategoryFilter: React.FC = () => {
    const { searchFilters, setSearchFilters, ferias } = useApp();

    const categories = [
        { id: 'Todos', label: 'Todos', icon: '📍', color: 'bg-gray-100 text-gray-700' },
        { id: 'Mercados', label: 'Mercados', icon: '🛒', color: 'bg-orange-100 text-orange-700' },
        { id: 'Ferias', label: 'Ferias', icon: '🎪', color: 'bg-red-100 text-red-700' },
        { id: 'Cultura', label: 'Cultura', icon: '🎭', color: 'bg-cyan-100 text-cyan-700' }
    ];

    const getCategoryCount = (category: string) => {
        if (category === 'Todos') return ferias.length;
        return ferias.filter(feria => feria.categoria === category).length;
    };

    const handleCategoryChange = (category: string) => {
        setSearchFilters({
            ...searchFilters,
            categoria: category
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">¿Qué buscas?</h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {categories.map((category) => {
                    const isActive = searchFilters.categoria === category.id ||
                        (!searchFilters.categoria && category.id === 'Todos');
                    const count = getCategoryCount(category.id);

                    return (
                        <Button
                            key={category.id}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className={`h-auto p-3 flex flex-col items-center gap-2 transition-all duration-300 ${isActive
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg scale-105'
                                    : 'hover:bg-orange-50 border-gray-200 hover:border-orange-300 hover:scale-102'
                                }`}
                            onClick={() => handleCategoryChange(category.id)}
                        >
                            <span className="text-xl">{category.icon}</span>
                            <span className="text-xs font-semibold">{category.label}</span>
                            <Badge
                                variant="secondary"
                                className={`text-xs px-2 py-0.5 ${isActive
                                        ? 'bg-white bg-opacity-20 text-white'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {count}
                            </Badge>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryFilter;