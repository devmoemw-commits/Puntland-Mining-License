"use client";

import { useRef, useState } from "react";
import { ImageKitProvider, IKUpload } from "imagekitio-next";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import config from "@/lib/config/config";
import Image from "next/image";

type ImageKitUploadResponse = {
  filePath: string;
  name: string;
  url: string;
  fileId: string;
  size: number;
};

const {
  env: {
    imagekit: { publicKey, urlEndpoint },
  },
} = config;

const authenticator = async () => {
  const endpoints = ["/api/auth/imagekit", `${config.env.apiEndpoint}/api/auth/imagekit`];
  let lastError = "Failed to initialize upload";

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) {
        let message = "Failed to initialize upload";
        try {
          const err = (await response.json()) as { error?: string };
          if (err?.error) message = err.error;
        } catch {
          // ignore parse errors and keep generic message
        }
        lastError = message;
        continue;
      }
      const data = await response.json();
      const { signature, expire, token } = data;
      return { token, expire, signature };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  throw new Error(lastError);
};

type Props = {
  label: string;
  description?: string;
  imageKitFolder: string;
  value: string;
  onUrlChange: (url: string) => void;
};

export function SystemAssetUpload({
  label,
  description,
  imageKitFolder,
  value,
  onUrlChange,
}: Props) {
  const IKUploadRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const onError = (error?: unknown) => {
    setUploading(false);
    setProgress(0);
    const message = (() => {
      if (error instanceof Error && error.message) return error.message;
      if (typeof error === "string" && error.trim()) return error;
      if (error && typeof error === "object") {
        const record = error as Record<string, unknown>;
        const msg = record.message ?? record.error_description ?? record.error;
        if (typeof msg === "string" && msg.trim()) return msg;
      }
      return "Upload failed";
    })();
    console.error("Image upload failed:", error);
    toast.error(message);
  };

  const onSuccess = (res: ImageKitUploadResponse) => {
    const normalizedEndpoint = (urlEndpoint ?? "").replace(/\/+$/, "");
    const normalizedPath = (res.filePath ?? "").replace(/^\/+/, "");
    const fullUrl = res.url || `${normalizedEndpoint}/${normalizedPath}`;
    onUrlChange(fullUrl);
    setUploading(false);
    setProgress(100);
    toast.success("Uploaded");
    setTimeout(() => setProgress(0), 1500);
  };

  const MAX = 5 * 1024 * 1024;

  const onUploadStart = () => {
    const input = IKUploadRef.current;
    const file = input?.files?.[0];
    if (file && file.size > MAX) {
      toast.error("File must be 5MB or smaller");
      if (input) input.value = "";
      return;
    }
    setUploading(true);
    setProgress(0);
  };

  const onUploadProgress = (ev: { loaded?: number; total?: number }) => {
    if (ev.loaded != null && ev.total != null && ev.total > 0) {
      setProgress(Math.round((ev.loaded * 100) / ev.total));
    }
  };

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <div className="space-y-2 rounded-lg border p-4">
        <div>
          <p className="font-medium text-sm">{label}</p>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          ) : null}
        </div>
        {value ? (
          <div className="relative h-24 w-full max-w-xs rounded border bg-muted/30 overflow-hidden">
            <Image
              src={value}
              alt=""
              fill
              className="object-contain p-1"
              unoptimized
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7"
              onClick={() => onUrlChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        {uploading && (
          <Progress value={progress} className="h-1.5" />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={(e) => {
              e.preventDefault();
              IKUploadRef.current?.click();
            }}
          >
            <Upload className="h-4 w-4 mr-1" />
            {value ? "Replace image" : "Upload image"}
          </Button>
          <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
        </div>
        <IKUpload
          className="hidden"
          ref={IKUploadRef}
          folder={imageKitFolder}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onError={onError}
          onSuccess={onSuccess}
          onUploadStart={onUploadStart}
          onUploadProgress={onUploadProgress}
        />
      </div>
    </ImageKitProvider>
  );
}
