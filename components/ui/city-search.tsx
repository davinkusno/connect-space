"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCitiesByCountry, searchCities, searchCountries, type City, type Country } from "@/lib/api/cities";
import { cn } from "@/lib/utils";
import { ChevronRight, Globe, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CitySearchProps {
  value?: string;
  onCitySelect?: (city: City) => void;
  placeholder?: string;
  className?: string;
}

export function CitySearch({
  value = "",
  onCitySelect,
  placeholder = "Search by city or country...",
  className,
}: CitySearchProps) {
  const [query, setQuery] = useState(value);
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Sync query with value prop
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setCities([]);
      setCountries([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    setIsSearching(true);
    setShowResults(true);

    try {
      // First, check if query looks like a country name
      const countryResults = await searchCountries(query);
      
      if (countryResults.length > 0 && query.length > 3) {
        // If we found countries, show them first
        setCountries(countryResults);
        
        // Also search for cities in those countries
        const cityPromises = countryResults.slice(0, 3).map((country) =>
          getCitiesByCountry(country.code, 10)
        );
        const cityResults = await Promise.all(cityPromises);
        const allCities = cityResults.flat();
        setCities(allCities);
      } else {
        // Search for cities directly
        const cityResults = await searchCities(query, undefined, 20);
        setCities(cityResults);
        setCountries([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setCities([]);
      setCountries([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (city: City) => {
    setQuery(city.displayName || city.name);
    setShowResults(false);
    onCitySelect?.(city);
  };

  const handleCountrySelect = async (country: Country) => {
    setSelectedCountry(country.code);
    setQuery(country.name);
    setIsSearching(true);
    
    try {
      const countryCities = await getCitiesByCountry(country.code, 30);
      setCities(countryCities);
      setCountries([]);
    } catch (error) {
      console.error("Error fetching cities for country:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Group cities by country
  const groupedCities = cities.reduce((acc, city) => {
    const country = city.country || "Unknown";
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative h-full">
        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10 pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length >= 2) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="pl-12 pr-10 py-4 text-lg border-0 rounded-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 placeholder:text-gray-500 h-full w-full"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full z-10"
            onClick={() => {
              setQuery("");
              setCities([]);
              setCountries([]);
              setShowResults(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (cities.length > 0 || countries.length > 0 || isSearching) && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto z-[9999]"
        >
          {isSearching ? (
            <div className="p-4 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          ) : (
            <>
              {/* Countries Section */}
              {countries.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Countries
                  </div>
                  {countries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {country.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {country.code}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  ))}
                </div>
              )}

              {/* Cities Section */}
              {cities.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    Cities
                  </div>
                  {Object.entries(groupedCities).map(([country, countryCities]) => (
                    <div key={country} className="mb-2">
                      <div className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                        {country}
                      </div>
                      {countryCities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm">
                                {city.name}
                              </div>
                              {city.state && (
                                <div className="text-xs text-gray-500">
                                  {city.state}, {country}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!isSearching && cities.length === 0 && countries.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No results found. Try a different search term.
                </div>
              )}
            </>
          )}
        </div>
      )}

    </div>
  );
}

