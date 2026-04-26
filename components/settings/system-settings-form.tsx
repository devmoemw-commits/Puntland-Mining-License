"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SystemAssetUpload } from "@/components/settings/system-asset-upload";
import { updateSystemSettings } from "@/lib/actions/system-config.action";
import { toast } from "sonner";
import type { CertificateAssets } from "@/lib/data/get-system-config";

export function SystemSettingsForm({ initial }: { initial: CertificateAssets }) {
  const [ministerStampUrl, setMinisterStampUrl] = useState(
    initial.ministerStampUrl ?? "",
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await updateSystemSettings({
      ministerStampUrl,
    });
    setPending(false);
    if (res?.serverError) {
      toast.error(res.serverError);
      return;
    }
    if (res?.validationErrors) {
      toast.error("Check the URLs and try again.");
      return;
    }
    const data = res?.data;
    if (data && "error" in data && data.error) {
      toast.error(String(data.error));
      return;
    }
    toast.success("Settings saved");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Organization stamp</CardTitle>
          <CardDescription>
            Official minister / seal image (ImageKit) used on all printed mining
            licenses. Personal signatures are uploaded per user in Profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <SystemAssetUpload
            label="Minister / official stamp"
            description="Shown in the official seal area on the certificate."
            imageKitFolder="/system/minister-stamp"
            value={ministerStampUrl}
            onUrlChange={setMinisterStampUrl}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
