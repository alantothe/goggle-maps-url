import { useState } from "react";
import { formatLocationHierarchy } from "@client/shared/lib/utils";
import { useLocationDetail } from "../../hooks";

interface LocationListItemProps {
  location: {
    id: number;
    name: string;
    category: string;
    location?: string;
  };
  onClick?: (id: number) => void;
}

export function LocationListItem({ location, onClick }: LocationListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: locationDetail, isLoading, error } = useLocationDetail(isExpanded ? location.id : null);

  const handleClick = () => {
    if (onClick) {
      onClick(location.id);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "6px",
        padding: "0.75rem",
        backgroundColor: "#ffffff",
        cursor: "pointer",
      }}
      onClick={handleClick}
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

      {isExpanded && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #eee" }}>
          {isLoading && (
            <p style={{ fontSize: "0.875rem", color: "#666" }}>Loading details...</p>
          )}

          {error && (
            <p style={{ fontSize: "0.875rem", color: "#d32f2f" }}>
              Error loading details: {error.message}
            </p>
          )}

          {locationDetail && (
            <div style={{ fontSize: "0.875rem", color: "#333" }}>
              {locationDetail.title && locationDetail.title !== locationDetail.source?.name && (
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Title:</strong> {locationDetail.title}
                </p>
              )}

              {locationDetail.source?.address && (
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Address:</strong> {locationDetail.source.address}
                </p>
              )}

              {locationDetail.contact?.phoneNumber && (
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Phone:</strong> {locationDetail.contact.phoneNumber}
                </p>
              )}

              {locationDetail.contact?.website && (
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Website:</strong>{" "}
                  <a
                    href={locationDetail.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1976d2", textDecoration: "none" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {locationDetail.contact.website}
                  </a>
                </p>
              )}

              {locationDetail.coordinates?.lat && locationDetail.coordinates?.lng && (
                <p style={{ margin: "0.25rem 0" }}>
                  <strong>Coordinates:</strong> {locationDetail.coordinates.lat}, {locationDetail.coordinates.lng}
                </p>
              )}

              {locationDetail.instagram_embeds?.length > 0 && (
                <div style={{ margin: "0.5rem 0" }}>
                  <strong>Instagram Posts:</strong>
                  <ul style={{ margin: "0.25rem 0", paddingLeft: "1rem" }}>
                    {locationDetail.instagram_embeds.map((embed) => (
                      <li key={embed.id} style={{ margin: "0.25rem 0" }}>
                        <a
                          href={embed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1976d2", textDecoration: "none" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{embed.username}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {locationDetail.uploads?.length > 0 && (
                <div style={{ margin: "0.5rem 0" }}>
                  <strong>Uploaded Images:</strong>
                  <p style={{ margin: "0.25rem 0", fontSize: "0.75rem", color: "#666" }}>
                    {locationDetail.uploads.length} image{locationDetail.uploads.length !== 1 ? 's' : ''} uploaded
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
