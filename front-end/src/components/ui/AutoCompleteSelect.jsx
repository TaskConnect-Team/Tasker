import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';

/**
 * A generic Autocomplete Multi-Select component.
 * 
 * @param {string[]} values - The master list of options to choose from.
 * @param {string[]} selectedValues - The current state array of selected items.
 * @param {Function} onValueChange - Callback function to update the parent state.
 * @param {string} label - The label displayed above the input.
 * @param {string} placeholder - Custom placeholder text.
 */
const AutoCompleteSelect = ({ 
  values = [], 
  selectedValues = [], 
  onValueChange, 
  label, 
  placeholder = "Search..." 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Filter logic: Match input and exclude already selected items
  const filteredOptions = values.filter(option =>
    option.toLowerCase().includes(query.toLowerCase()) && 
    !selectedValues.includes(option)
  );

  const handleAdd = (item) => {
    onValueChange([...selectedValues, item]);
    setQuery('');
    setIsOpen(false);
  };

  const handleRemove = (itemToRemove) => {
    onValueChange(selectedValues.filter(item => item !== itemToRemove));
  };

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      
      {/* Selection Area / Chips Container */}
      <div className="flex flex-wrap gap-2 min-h-[48px] p-2 rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-400 transition-all">
        {selectedValues.map(item => (
          <span 
            key={item} 
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white text-xs font-medium rounded-full animate-in fade-in zoom-in duration-200"
          >
            {item}
            <button 
              onClick={() => handleRemove(item)} 
              type="button" 
              className="hover:text-red-300 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        
        {/* Fixed: changed onValueChange to onChange */}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedValues.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[150px] outline-none text-sm bg-transparent px-1 py-1"
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in slide-in-from-top-2 duration-200">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleAdd(option)}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between group"
              >
                {option}
                <Search className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-400" />
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 italic">
              No matches found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoCompleteSelect;
