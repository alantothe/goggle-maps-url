import { useState } from "react";
import {
  usePendingTaxonomy,
  useApproveTaxonomy,
  useRejectTaxonomy,
} from "@client/shared/services/api/hooks";
import { Button } from "@client/components/ui/button";
import { formatLocationHierarchy } from "@client/shared/lib/utils";

export function TaxonomyReview() {
  const { data: pendingEntries, isLoading, error } = usePendingTaxonomy();
  const approveMutation = useApproveTaxonomy();
  const rejectMutation = useRejectTaxonomy();
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const handleApprove = async (locationKey: string) => {
    setProcessingKey(locationKey);
    try {
      await approveMutation.mutateAsync(locationKey);
    } finally {
      setProcessingKey(null);
    }
  };

  const handleReject = async (locationKey: string) => {
    setProcessingKey(locationKey);
    try {
      await rejectMutation.mutateAsync(locationKey);
    } finally {
      setProcessingKey(null);
    }
  };


  return (
    <div className="container mx-auto py-8 px-4">
      <div data-theme="light" className="bg-background rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-[24px]! font-bold mb-2 text-foreground">Taxonomy Review</h1>
          <p className="text-muted-foreground">
            Review and approve new neighborhoods discovered from location data.
            Only approved neighborhoods appear in public filters.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error loading pending entries</p>
            <p className="text-sm">Please try again later.</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
          </div>
        ) : pendingEntries && pendingEntries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <p className="text-muted-foreground">
              No pending taxonomy entries. All neighborhoods are approved!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    LocationKey
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Locations Using
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {pendingEntries?.map((entry) => (
                  <tr key={entry.locationKey} className="hover:bg-accent">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatLocationHierarchy(entry.locationKey)}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.locationCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        onClick={() => handleApprove(entry.locationKey)}
                        disabled={processingKey === entry.locationKey}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingKey === entry.locationKey && approveMutation.isPending
                          ? "Approving..."
                          : "✓ Approve"}
                      </Button>
                      <Button
                        onClick={() => handleReject(entry.locationKey)}
                        disabled={
                          processingKey === entry.locationKey ||
                          entry.locationCount > 0
                        }
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          entry.locationCount > 0
                            ? "Cannot reject: locations are using this taxonomy"
                            : "Reject this taxonomy entry"
                        }
                      >
                        {processingKey === entry.locationKey && rejectMutation.isPending
                          ? "Rejecting..."
                          : "✗ Reject"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
