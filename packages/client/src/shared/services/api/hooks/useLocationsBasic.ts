import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "../locations.api";

export const LOCATIONS_BASIC_QUERY_KEY = ["locations-basic"] as const;

export function useLocationsBasic() {
  return useQuery({
    queryKey: LOCATIONS_BASIC_QUERY_KEY,
    queryFn: () => locationsApi.getLocationsBasic(),
  });
}
