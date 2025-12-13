export type LocationCategory = 'dining' | 'accommodations' | 'attractions' | 'nightlife';

export type LocationType = 'maps' | 'instagram' | 'upload';

// Hierarchical Location Taxonomy Types
export interface NeighborhoodData {
  label: string;
  value: string;
}

export interface CityData {
  label: string;
  value: string;
  neighborhoods: NeighborhoodData[];
}

export interface CountryData {
  code: string;
  label: string;
  cities: CityData[];
}

export interface LocationTaxonomy {
  id?: number;
  country: string;
  city: string | null;
  neighborhood: string | null;
  locationKey: string; // Pipe-delimited: "colombia|bogota|chapinero"
}

export type DiningType =
  | 'restaurant'
  | 'fast-food'
  | 'food-truck'
  | 'cafe'
  | 'bar'
  | 'pub'
  | 'rooftop-bar'
  | 'street-food'
  | 'brewery'
  | 'winery'
  | 'seafood'
  | 'italian'
  | 'american'
  | 'wine-bar'
  | 'cocktail-bar'
  | 'dive-bar'
  | 'buffet'
  | 'bakery'
  | 'dessert'
  | 'ice-cream'
  | 'coffee-shop'
  | 'tea-shop'
  | 'juice-bar'
  | 'smoothie-bar'
  | 'pizza';

export interface LocationEntry {
  id?: number;
  name: string;
  title?: string | null;
  address: string;
  url: string;
  embed_code?: string | null;
  instagram?: string | null;
  images?: string[];
  original_image_urls?: string[];
  lat?: number | null;
  lng?: number | null;
  parent_id?: number | null;
  type?: LocationType;
  category?: LocationCategory;
  dining_type?: DiningType | null;
  // Contact Information fields
  contactAddress?: string | null;
  countryCode?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  // Hierarchical Location Taxonomy
  locationKey?: string | null; // Pipe-delimited location key
}

export interface LocationWithChildren extends LocationEntry {
  instagram_embeds?: LocationEntry[];
  uploads?: LocationEntry[];
}

export interface CreateMapsRequest {
  name: string;
  title?: string | null;
  address: string;
  category?: LocationCategory;
  dining_type?: DiningType | null;
  contactAddress?: string;
  countryCode?: string;
  phoneNumber?: string;
  website?: string;
}

export interface UpdateMapsRequest {
  id: number;
  name: string;
  title?: string | null;
  address: string;
  category?: LocationCategory;
  dining_type?: DiningType | null;
  contactAddress?: string;
  countryCode?: string;
  phoneNumber?: string;
  website?: string;
}

export interface AddInstagramRequest {
  embedCode: string;
  locationId: number;
}

export interface AddUploadRequest {
  parentId: number;
}

export interface RawLocation {
  name: string;
  address: string;
}
