/**
 * React Query hooks for taxonomy corrections
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taxonomyAdminApi } from "../taxonomy-admin.api";
import type { TaxonomyCorrectionRequest } from "../types";

/**
 * Query key for taxonomy corrections cache
 */
export const TAXONOMY_CORRECTIONS_QUERY_KEY = ["admin", "taxonomy", "corrections"] as const;

/**
 * Fetch all taxonomy correction rules
 */
export function useTaxonomyCorrections() {
  return useQuery({
    queryKey: TAXONOMY_CORRECTIONS_QUERY_KEY,
    queryFn: () => taxonomyAdminApi.getCorrections(),
  });
}

/**
 * Create a new taxonomy correction rule
 */
export function useCreateTaxonomyCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaxonomyCorrectionRequest) =>
      taxonomyAdminApi.createCorrection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAXONOMY_CORRECTIONS_QUERY_KEY });
    },
  });
}

/**
 * Delete a taxonomy correction rule
 */
export function useDeleteTaxonomyCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      taxonomyAdminApi.deleteCorrection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAXONOMY_CORRECTIONS_QUERY_KEY });
    },
  });
}
