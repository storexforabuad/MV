"use client";

import { geography } from '@/config/geography';

interface CountryStateSelectorProps {
  selectedCountry: string;
  selectedState: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
}

const CountryStateSelector = ({
  selectedCountry,
  selectedState,
  onCountryChange,
  onStateChange,
}: CountryStateSelectorProps) => {
  const countryData = geography.find((c) => c.name === selectedCountry);
  const states = countryData?.states || [];

  // Reset state when country changes
  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry);
    onStateChange('');
  };

  return (
    <div className="space-y-4">
      {/* Country Dropdown with Flags */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
          Country
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d4a574' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          {geography.map((country) => (
            <option key={country.name} value={country.name}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* State Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
          State/Region
        </label>
        <select
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value)}
          disabled={!selectedCountry || states.length === 0}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23d4a574' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          <option value="">Select a state...</option>
          {states.map((state) => (
            <option key={state.name} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CountryStateSelector;
