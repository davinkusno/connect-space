/**
 * City Search API Utilities
 * Uses free geocoding APIs to fetch cities by country
 */

export interface City {
  id: string;
  name: string;
  country: string;
  countryCode?: string;
  state?: string;
  lat?: number;
  lng?: number;
  displayName: string;
}

export interface Country {
  code: string;
  name: string;
}

/**
 * Search for cities using OpenStreetMap Nominatim API (free, no key required)
 * This API is rate-limited but good for most use cases
 */
export async function searchCities(
  query: string,
  countryCode?: string,
  limit: number = 20
): Promise<City[]> {
  try {
    // Build search query
    let searchQuery = query;
    if (countryCode) {
      searchQuery = `${query}, ${countryCode}`;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&addressdetails=1&limit=${limit}&featuretype=city`,
      {
        headers: {
          'User-Agent': 'ConnectSpace/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }

    const data = await response.json();

    return data.map((item: any, index: number) => {
      const address = item.address || {};
      return {
        id: item.place_id?.toString() || `${item.lat}-${item.lon}-${index}`,
        name: item.name || address.city || address.town || address.village || query,
        country: address.country || '',
        countryCode: address.country_code?.toUpperCase() || '',
        state: address.state || address.region || '',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name || item.name,
      };
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

/**
 * Get cities by country code using REST Countries + GeoNames
 * Falls back to Nominatim if needed
 */
export async function getCitiesByCountry(
  countryCode: string,
  limit: number = 50
): Promise<City[]> {
  try {
    // First, get country name from country code
    const countryResponse = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode.toUpperCase()}`
    );
    
    if (!countryResponse.ok) {
      // Fallback to Nominatim search
      return searchCities(countryCode, undefined, limit);
    }

    const countryData = await countryResponse.json();
    const countryName = countryData[0]?.name?.common || countryCode;

    // Search for cities in that country using Nominatim
    return searchCities(countryName, countryCode, limit);
  } catch (error) {
    console.error('Error fetching cities by country:', error);
    // Fallback to basic search
    return searchCities(countryCode, undefined, limit);
  }
}

/**
 * Get list of countries (for country selection)
 */
export async function getCountries(): Promise<Country[]> {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }

    const data = await response.json();
    
    return data
      .map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
      }))
      .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

/**
 * Search for countries by name (for autocomplete)
 */
export async function searchCountries(query: string): Promise<Country[]> {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fields=name,cca2`
    );
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    return data
      .map((country: any) => ({
        code: country.cca2,
        name: country.name.common,
      }))
      .sort((a: Country, b: Country) => a.name.localeCompare(b.name))
      .slice(0, 10); // Limit to 10 results
  } catch (error) {
    console.error('Error searching countries:', error);
    return [];
  }
}

