import { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';

/**
 * A generic Autocomplete Single-Select component.
 * * @param {string[]} values - The master list of options (e.g., PAKISTAN_CITIES).
 * @param {string} selectedValue - The current selected item (string, not array).
 * @param {Function} onValueChange - Callback function to update the parent state.
 * @param {string} label - The label displayed above the input.
 * @param {string} placeholder - Custom placeholder text.
 */
const SingleAutoCompleteSelect = ({ 
  values = [], 
  selectedValue = "", 
  onValueChange, 
  label, 
  placeholder = "Search city..." 
}) => {

  const [query, setQuery] = useState(selectedValue);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync internal query state if the parent's selectedValue changes
  useEffect(() => {
    setQuery(selectedValue);
  }, [selectedValue]);

  // Filter logic: Match input (case-insensitive)
  const filteredOptions = values.filter(option =>
    option.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item) => {
    onValueChange(item); // Send string to parent
    setQuery(item);      // Update input text
    setIsOpen(false);    // Close dropdown
  };

  const handleClear = (e) => {
    e.stopPropagation(); // Prevent opening dropdown when clicking clear
    onValueChange("");
    setQuery("");
    setIsOpen(true); // Open dropdown so they can pick a new one
  };

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If they typed something but didn't select it, revert to the actual selected value
        setQuery(selectedValue);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedValue]);

  return (
    <div className="w-full relative space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      
      {/* Input Area */}
      <div className="relative flex items-center min-h-[48px] px-3 rounded-xl border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-400 transition-all">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 w-full outline-none text-sm bg-transparent py-2"
        />
        
        {/* Show Clear button only if a value is selected */}
        {selectedValue && (
          <button 
            onClick={handleClear} 
            type="button" 
            className="p-1 hover:text-red-500 text-slate-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in slide-in-from-top-2 duration-200">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group ${
                  selectedValue === option 
                    ? 'bg-slate-100 text-slate-900 font-medium' 
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {option}
                {/* Always show icon if selected, otherwise show on hover */}
                <Search className={`h-3 w-3 ${selectedValue === option ? 'opacity-100 text-slate-900' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
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

export default SingleAutoCompleteSelect;