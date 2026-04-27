"use client";

import { useState } from "react";
import { SystemAssetUpload } from "@/components/settings/system-asset-upload";
import { updateUserSignatureImage } from "@/lib/actions/auth.action";
import { toast } from "sonner";

type Props = {
  userId: string;
  initialUrl: string;
};

export function ProfileSignatureUpload({ userId, initialUrl }: Props) {
  const [value, setValue] = useState(initialUrl);

  async function onUrlChange(url: string) {
    const previousValue = value;
    setValue(url);
    try {
      const res = await updateUserSignatureImage(userId, url ? url : null);
      if (res.success) {
        toast.success("Signature image saved");
      } else {
        setValue(previousValue);
        toast.error(res.error);
      }
    } catch {
      setValue(previousValue);
      toast.error("Failed to save signature image");
    }
  }

  return (
    <SystemAssetUpload
      label="Your certificate signature"
      description="Uploaded to ImageKit. This image is printed on mining licenses when you apply the official signature. The minister stamp is configured under Settings."
      imageKitFolder={`/users/${userId}/signature`}
      value={value}
      onUrlChange={onUrlChange}
    />
  );
}
