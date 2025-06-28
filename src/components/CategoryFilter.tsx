import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const CategoryFilter: React.FC = () => {
    const { searchFilters, setSearchFilters, ferias } = useApp();

    const categories = [
        { id: 'Todos', label: 'Todos', icon: '📍', color: 'bg-gray-100 text-gray-700' },
        { id: 'Mercados', label: 'Mercados', icon: '🛒', color: 'bg-blue-100 text-blue-700' },
        { id: 'Ferias', label: 'Ferias', icon: '🎪', color: 'bg-orange-100 text-orange-700' },
        { id: 'Cultura', label: 'Cultura', icon: '🎭', color: 'bg-purple-100 text-purple-700' }
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
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">¿Qué buscas?</h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map((category) => {
                    const isActive = searchFilters.categoria === category.id ||
                        (!searchFilters.categoria && category.id === 'Todos');
                    const count = getCategoryCount(category.id);

                    return (
                        <Button
                            key={category.id}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            className={`h-auto p-3 flex flex-col items-center gap-1 transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                    : 'hover:bg-gray-50 border-gray-200'
                                }`}
                            onClick={() => handleCategoryChange(category.id)}
                        >
                            <span className="text-lg">{category.icon}</span>
                            <span className="text-xs font-medium">{category.label}</span>
                            <Badge
                                variant="secondary"
                                className={`text-xs px-1.5 py-0.5 ${isActive
                                        ? 'bg-blue-500 text-white'
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