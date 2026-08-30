import type { ProjectStatus } from "@/lib/projects";
import { formatDate } from "@/lib/projects";

export function Updated({ iso }: { iso: string }) {
  return (
    <span className="mono" title={new Date(iso).toISOString().slice(0, 10)}>
      updated {formatDate(iso)}
    </span>
  );
}
