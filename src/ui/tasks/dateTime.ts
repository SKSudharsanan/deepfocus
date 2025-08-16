// src/ui/datetime.ts
export function localToIsoUtc(local: string | null): string | null {
    if (!local) return null;                 // e.g. ""
    const ms = Date.parse(local);            // interprets as local time
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  
  export function isoUtcToLocalInput(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }