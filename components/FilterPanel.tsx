import React from 'react';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  maxHeight?: string;
}

interface FilterPanelProps {
  filters: Record<string, string[]>;
  filterGroups: FilterGroup[];
  onToggleFilter: (groupKey: string, value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  filterGroups,
  onToggleFilter,
  onClearFilters,
  activeFilterCount,
  className = ''
}) => {
  return (
    <div className={`p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4 animate-fade-in ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Filters</h3>
        <button onClick={onClearFilters} className="text-xs text-slate-500 hover:text-red-600 underline">
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filterGroups.map((group) => (
          <div key={group.key}>
            <label className="text-xs font-semibold text-slate-700 mb-2 block">{group.label}</label>
            <div className={`space-y-1 ${group.maxHeight ? `max-h-${group.maxHeight} overflow-y-auto pr-2` : ''}`}>
              {group.options.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={filters[group.key]?.includes(option.value) || false}
                    onChange={() => onToggleFilter(group.key, option.value)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={option.color || 'text-slate-600'}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterPanel;