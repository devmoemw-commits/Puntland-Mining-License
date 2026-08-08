"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LicenseMap } from "./license-map";
import { SetLicenseCoordinates } from "@/lib/actions/licenses.action";
import type { MapLicense } from "@/lib/data/map-licenses";

const LEGEND: { label: string; color: string }[] = [
  { label: "Approved", color: "#16a34a" },
  { label: "Pending", color: "#ca8a04" },
  { label: "In Review", color: "#2563eb" },
  { label: "Rejected", color: "#dc2626" },
  { label: "Suspended", color: "#ea580c" },
  { label: "Cancelled", color: "#6b7280" },
];

function MissingRow({ license, onSaved }: { license: MapLicense; onSaved: () => void }) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error("Enter valid numeric coordinates");
      return;
    }
    setSaving(true);
    const res = await SetLicenseCoordinates({ id: license.id, latitude, longitude });
    setSaving(false);
    if (res?.data?.error) {
      toast.error(String(res.data.error));
      return;
    }
    toast.success("Coordinates saved");
    onSaved();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b py-2 text-sm">
      <div className="min-w-[200px] flex-1">
        <div className="font-medium">{license.company}</div>
        <div className="font-mono text-xs text-muted-foreground">{license.ref}</div>
      </div>
      <Input
        className="w-28"
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
      />
      <Input
        className="w-28"
        placeholder="Longitude"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
      />
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

export function MapClient({ licenses }: { licenses: MapLicense[] }) {
  const router = useRouter();
  const withCoords = licenses.filter((l) => l.lat != null && l.lng != null);
  const missing = licenses.filter((l) => l.lat == null || l.lng == null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: l.color }}
            />
            {l.label}
          </div>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          {withCoords.length} mapped · {missing.length} without coordinates
        </span>
      </div>

      <LicenseMap licenses={withCoords} />

      {missing.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-medium">Set coordinates</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            These licenses have no GPS location yet. Enter decimal coordinates
            (e.g. latitude 8.41, longitude 48.48) to place them on the map.
          </p>
          <div className="max-h-80 overflow-auto">
            {missing.map((l) => (
              <MissingRow key={l.id} license={l} onSaved={() => router.refresh()} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
