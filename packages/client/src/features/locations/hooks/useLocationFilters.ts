import { useState } from "react";
import type { Category } from "@client/shared/services/api/types";

export function useLocationFilters() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCountryChange = (country: string | null) => {
    setSelectedCountry(country);
    // Don't reset category when country is cleared - they can be used independently
  };

  const reset = () => {
    setSelectedCountry(null);
    setSelectedCategory(null);
  };

  return {
    selectedCountry,
    selectedCategory,
    setCountry: handleCountryChange,
    setCategory: setSelectedCategory,
    reset,
    isFilterActive: !!(selectedCountry || selectedCategory) // Active if either is selected
  };
}
