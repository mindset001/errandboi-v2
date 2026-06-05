import { cn, statusColor, statusLabel } from "@/lib/utils";

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        statusColor(status),
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
