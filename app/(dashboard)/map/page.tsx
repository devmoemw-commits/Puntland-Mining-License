import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";
import { listMapLicenses } from "@/lib/data/map-licenses";
import { MapClient } from "./_components/map-client";

export default async function MapPage() {
  const denied = await requireActionPermission(Permissions.LICENSE_REGISTER);
  if (denied) {
    return (
      <div className="my-6 text-sm text-muted-foreground">
        You do not have permission to view the GIS map.
      </div>
    );
  }

  const licenses = await listMapLicenses();

  return (
    <div>
      <div className="my-5">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          GIS Map
        </h1>
        <p className="text-sm text-muted-foreground">
          Mining licences plotted by location and colour-coded by status.
        </p>
      </div>
      <MapClient licenses={licenses} />
    </div>
  );
}
