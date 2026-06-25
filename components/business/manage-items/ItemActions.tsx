import { Edit3Icon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ItemActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-primary/10 rounded-full transition-colors">
          <MoreHorizontalIcon size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl">
        <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
          <Edit3Icon size={14} /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 cursor-pointer text-destructive focus:bg-destructive/10"
        >
          <Trash2Icon size={14} /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
