"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import type { MapLicense } from "@/lib/data/map-licenses";

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "#16a34a",
  PENDING: "#ca8a04",
  REVIEW: "#2563eb",
  REJECTED: "#dc2626",
  SUSPENDED: "#ea580c",
  CANCELLED: "#6b7280",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

export function LicenseMap({ licenses }: { licenses: MapLicense[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    const withCoords = licenses.filter(
      (l) => l.lat != null && l.lng != null,
    ) as (MapLicense & { lat: number; lng: number })[];

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Default center: roughly Puntland, Somalia.
      const map = L.map(containerRef.current).setView([8.5, 48.5], 6);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const l of withCoords) {
        const color = STATUS_COLOR[l.status] ?? "#6b7280";
        const marker = L.circleMarker([l.lat, l.lng], {
          radius: 8,
          color,
          fillColor: color,
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(map);
        marker.bindPopup(
          `<div style="min-width:160px">
            <div style="font-weight:600">${escapeHtml(l.company)}</div>
            <div style="font-family:monospace;font-size:11px">${escapeHtml(l.ref)}</div>
            <div style="font-size:12px">${escapeHtml(l.status)}${l.district ? " · " + escapeHtml(l.district) : ""}</div>
            <a href="/licenses/${l.id}" style="color:#2563eb;font-size:12px">Open license →</a>
          </div>`,
        );
        bounds.push([l.lat, l.lng]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [licenses]);

  return (
    <div
      ref={containerRef}
      className="h-[70vh] w-full rounded-lg border"
      style={{ background: "#e5e7eb" }}
    />
  );
}
