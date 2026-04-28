import Image from "next/image";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import config from "@/lib/config/config";

type LicenseProps = {
  licenseNumber: string;
  companyName: string;
  licenseType: string;
  license_category: string;
  miningArea: string[];
  signature: boolean;
  issueDate: string;
  expiryDate: string;
  qrCodeUrl?: string;
  /** Signer’s profile image (ImageKit); falls back to `/assets/signature.png`. */
  signerSignatureUrl?: string | null;
  /** Full URL from system settings; falls back to `/assets/moemw-logo.png`. */
  ministerStampUrl?: string | null;
};

export default function MiningLicense({
  licenseNumber,
  companyName,
  license_category,
  miningArea,
  signature,
  issueDate,
  expiryDate,
  qrCodeUrl,
  signerSignatureUrl,
  ministerStampUrl,
}: LicenseProps) {
  //format date
  const issueDateFormatted = new Date(issueDate).toLocaleDateString("en-US");
  const expiryDateFormatted = new Date(expiryDate).toLocaleDateString("en-US");

  return (
    <Card
      className="relative w-[960px] max-w-full aspect-[297/210] mx-auto overflow-hidden text-[#04224c]
                 print:w-[297mm] print:h-[210mm] print:max-w-none print:aspect-auto print:p-0 print:border-0 print:shadow-none print:rounded-none"
      style={{ fontFamily: "Times New Roman, Times, serif" }}
    >
      {/* Background Image - Kept separate */}
      <div className="absolute inset-0 z-10">
        <Image
          src="/assets/pl_mining_license.svg"
          alt="Certificate Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      {/* Overlay: normal flow layout (no absolute children) */}
      <div className="absolute inset-0 z-50 flex h-full flex-col">
        {/* Header (top band) */}
        <div
          className="text-center print:!mt-[24mm] print:!mx-[20mm] print:!mb-[6mm]"
          style={{ margin: "60px 116px 22px" }}
        >
          <div className="grid grid-cols-3 items-start">
            <h2 className="text-[10px] sm:text-[11px] md:text-[12px] print:text-lg font-semibold leading-snug text-left">
              Dowladda Puntland ee Soomaaliya <br /> Wasaaradda Tamarta Macdanta
              & Biyaha <br /> Xafiiska Wasiirka
            </h2>
            <div className="mx-auto">
              <div className="relative h-[44px] w-[110px] sm:h-[56px] sm:w-[135px] md:h-[64px] md:w-[150px] print:h-[100px] print:w-[200px]">
                <Image
                  src="/assets/puntland_logo.svg"
                  alt="Puntland Logo"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
            <h2 className="text-[10px] sm:text-[11px] md:text-[12px] print:text-lg font-semibold leading-snug text-right">
              Puntland State of Somalia <br /> Ministry of Energy Minerals &
              Water <br /> Office of the Minister
            </h2>
          </div>

          <div className="mt-1 leading-tight">
            <h1 className="text-[10px] sm:text-sm md:text-base print:text-2xl font-bold m-0">
              SHATIGA KA GANACSIGA MACDANTA
            </h1>
            <h1 className="text-[10px] sm:text-sm md:text-base print:text-2xl font-bold">
              MINING LICENSE
            </h1>
          </div>

          <p className="text-[11px] sm:text-[12px] md:text-[13px] print:text-xl leading-snug">
            Wasaaradda Tamarta Macdanta iyo Biyaha waxay shatiga ganacsiga
            macdanta u oggolaatay <br />
            Ministry of Energy Minerals & Water has granted the mining license
          </p>
        </div>

        {/* Main dynamic block */}
        <div
          className="space-y-2 text-[12px] sm:text-[13px] md:text-[14px] print:text-[20px] leading-snug capitalize print:!mx-[20mm]"
          style={{ margin: "0 129px" }}
        >
          <p className="font-medium">{licenseNumber}</p>
          <p>
            Shirkadda/Company:{" "}
            <span className="font-semibold">{companyName}</span>
          </p>
          <p>
            Nooca Shatiga/type of License:{" "}
            <span className="font-semibold">{license_category}</span>
          </p>
          <p>
            Shirkaddu waxay ka shaqayn karta Degmada/Mining Area:{" "}
            <span className="font-semibold">{miningArea.join(", ")}</span>
          </p>
          <p>
            Date Of Issue: <span className="font-semibold">{issueDateFormatted}</span>
          </p>
        </div>

        {/* Expiry date (right aligned) */}
        <div
          className="text-[12px] sm:text-[13px] md:text-[14px] print:text-[20px] leading-snug text-red-600 flex justify-end print:!mr-[20mm]"
          style={{ marginRight: 137 }}
        >
          Date Of Expiry:{" "}
          <span className="font-semibold">{expiryDateFormatted}</span>
        </div>

        <div className="flex-1" />

        {/* Footer caption */}
        <div className="text-center">
          <p className="text-[11px] sm:text-[12px] md:text-[13px] print:text-[20px] font-medium leading-tight">
            Wasiirka Wasaaradda Tamarta, Macdanta Biyaha <br />
            Ministry Of Energy Minerals and Water
          </p>
        </div>

        {/* Bottom row: stamp / signature / QR (space-between) */}
        <div
          className="mt-2 flex items-end justify-between print:!mx-[20mm] print:!mb-[20mm]"
          style={{ margin: "8px 116px 99px" }}
        >
          <div className="flex items-end">
            <div className="relative h-[72px] w-[72px] sm:h-[84px] sm:w-[84px] md:h-[96px] md:w-[96px] print:h-[100px] print:w-[100px]">
              <Image
                src={ministerStampUrl || "/assets/moemw-logo.png"}
                alt="Official Seal"
                fill
                style={{ objectFit: "contain" }}
                unoptimized={!!ministerStampUrl}
              />
            </div>
          </div>

          <div className="flex flex-1 justify-center">
            {signature ? (
              <div className="relative h-[56px] w-[140px] sm:h-[64px] sm:w-[170px] md:h-[72px] md:w-[190px] print:h-[110px] print:w-[230px]">
                <Image
                  src={signerSignatureUrl || "/assets/signature.png"}
                  alt="Signature"
                  fill
                  className="object-contain"
                  unoptimized={!!signerSignatureUrl}
                />
              </div>
            ) : (
              <div className="text-[12px] sm:text-[13px] md:text-[14px] print:text-[20px]">
                Signature
              </div>
            )}
          </div>

          <div className="flex items-end">
            {qrCodeUrl ? (
              <div className="border-2 border-blue-200 bg-white p-[3px]">
                <QRCodeSVG
                  value={`${config.env.apiEndpoint}/verify-license?ref_id=${licenseNumber}`}
                  size={96}
                  level="H"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
