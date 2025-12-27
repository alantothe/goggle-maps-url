import { Settings } from "lucide-react";
import { RefObject } from "react";

interface LocationItemMenuProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  menuRef: RefObject<HTMLDivElement | null>;
}

/**
 * Settings menu component for location list items
 * Shows Edit and Delete options in a dropdown
 */
export function LocationItemMenu({ isOpen, onToggle, onEdit, onDelete, menuRef }: LocationItemMenuProps) {
  return (
    <div className="relative" ref={menuRef}>
      <Settings
        size={16}
        className="text-black cursor-pointer"
        onClick={onToggle}
      />
      {isOpen && (
        <div className="absolute right-full mr-2 top-0 z-10 bg-white border border-gray-200 rounded py-0.5 min-w-[80px] max-h-[77px]">
          <button
            className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
