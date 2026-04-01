import { useState } from 'react';

interface SearchProps {
  onSearch: (query: string, filters: Filters) => void;
}

interface Filters {
  category: string;
  priceRange: [number, number];
}

export default function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  const handleSearch = () => {
    onSearch(query, { category, priceRange });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="border rounded p-2"
        />
        <button onClick={handleSearch} className="ml-2 p-2 bg-blue-500 text-white rounded">
          Search
        </button>
      </div>
      <div className="flex items-center gap-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded p-2">
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="fashion">Fashion</option>
          <option value="home">Home</option>
        </select>
        <input
          type="number"
          value={priceRange[0]}
          onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
          placeholder="Min Price"
          className="border rounded p-2"
        />
        <input
          type="number"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          placeholder="Max Price"
          className="border rounded p-2"
        />
      </div>
    </div>
  );
}
