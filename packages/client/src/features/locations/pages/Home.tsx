import { useLocationsBasic } from "@client/shared/services/api";
import { formatLocationHierarchy } from "@client/shared/lib/utils";

export function Home() {
  const { data, isLoading, error, refetch } = useLocationsBasic();
  const locations = data?.locations ?? [];

  if (isLoading) {
    return (
      <div>
        <h1>Welcome to Location Manager</h1>
        <p>Loading locations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Welcome to Location Manager</h1>
        <p style={{ color: "red" }}>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to Location Manager</h1>
      <p>Manage your locations with Google Maps and Instagram integration.</p>

      <div style={{ marginTop: "2rem" }}>
        <h2>All Locations ({locations.length})</h2>

        {locations.length === 0 ? (
          <p>No locations found. Add your first location to get started!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {locations.map((location) => (
              <div
                key={location.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  padding: "0.75rem",
                  backgroundColor: "#ffffff"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "500", color: "#1a1a1a" }}>
                    {location.name}
                  </span>
                  <span style={{ fontSize: "0.875rem", color: "#666", textTransform: "capitalize" }}>
                    {location.category}
                  </span>
                </div>
                {location.location && (
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#666" }}>
                    {formatLocationHierarchy(location.location)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
