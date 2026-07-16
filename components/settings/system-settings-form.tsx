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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SystemAssetUpload } from "@/components/settings/system-asset-upload";
import { updateSystemSettings } from "@/lib/actions/system-config.action";
import { toast } from "sonner";
import type { CertificateAssets } from "@/lib/data/get-system-config";
import type {
  OrgContact,
  SampleSignatoryConfig,
} from "@/lib/data/get-sample-signatory";

type RoleOption = { code: string; name: string };

export function SystemSettingsForm({
  initial,
  signatory,
  contact,
  roleOptions = [],
}: {
  initial: CertificateAssets;
  signatory?: SampleSignatoryConfig;
  contact?: OrgContact;
  roleOptions?: RoleOption[];
}) {
  const [ministerStampUrl, setMinisterStampUrl] = useState(
    initial.ministerStampUrl ?? "",
  );
  const [signatoryRole, setSignatoryRole] = useState(signatory?.roleCode ?? "");
  const [signatoryTitle, setSignatoryTitle] = useState(signatory?.title ?? "");
  const [contactTel, setContactTel] = useState(contact?.tel ?? "");
  const [contactEmail, setContactEmail] = useState(contact?.email ?? "");
  const [contactWebsite, setContactWebsite] = useState(contact?.website ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await updateSystemSettings({
      ministerStampUrl,
      sampleSignatoryRole: signatoryRole,
      sampleSignatoryTitle: signatoryTitle,
      orgContactTel: contactTel,
      orgContactEmail: contactEmail,
      orgContactWebsite: contactWebsite,
    });
    setPending(false);
    if (res?.serverError) {
      toast.error(res.serverError);
      return;
    }
    if (res?.validationErrors) {
      toast.error("Check the values and try again.");
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample analysis signatory</CardTitle>
          <CardDescription>
            The letter shows the name and profile signature of the user who
            holds this role, with the title line below it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signatory-role">Signatory role</Label>
            <select
              id="signatory-role"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={signatoryRole}
              onChange={(e) => setSignatoryRole(e.target.value)}
              disabled={pending}
            >
              <option value="">Default (General Director)</option>
              {roleOptions.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signatory-title">Signatory title</Label>
            <Input
              id="signatory-title"
              value={signatoryTitle}
              onChange={(e) => setSignatoryTitle(e.target.value)}
              placeholder="Director General of the Ministry of Energy, Minerals & Water"
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact information</CardTitle>
          <CardDescription>
            Printed in the footer of sample analysis letters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-tel">Telephone</Label>
            <Input
              id="contact-tel"
              value={contactTel}
              onChange={(e) => setContactTel(e.target.value)}
              placeholder="+252 907 993813, +252 661711119"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Office email</Label>
            <Input
              id="contact-email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="dg.moemw@plstate.so"
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-website">Website</Label>
            <Input
              id="contact-website"
              value={contactWebsite}
              onChange={(e) => setContactWebsite(e.target.value)}
              placeholder="www.moemw.pl.so"
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
