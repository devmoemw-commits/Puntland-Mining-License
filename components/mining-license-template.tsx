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
    //w-[1080px] h-[768px]
    <Card
      className="relative w-full max-w-[320px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[1000px] 
                   aspect-[297/210] mx-auto p-3 sm:p-6 md:p-12 lg:p-16 xl:p-20 overflow-hidden text-[#04224c] 
                   print:w-[297mm] print:h-[210mm] print:max-w-none print:aspect-auto print:p-[20mm]"
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

      {/* Content Container - Groups all content elements */}
      <div className="relative z-50 h-full print:p-4">
        {/* Header Section */}
        <div className="text-center w-[98%] mx-auto print:px-10 print:mt-8 -mt-3">
          <div className="flex items-center justify-between">
            <h2 className="xlg:text-[13px] text-[10px] print:text-lg  font-semibold leading-tight">
              Dowladda Puntland ee Soomaaliya <br /> Wasaaradda Tamarta Macdanta
              & Biyaha <br /> Xafiiska Wasiirka
            </h2>
            <div className="relative print:w-[200px] print:h-[100px] xlg:w-[150px] xlg:h-[80px] w-[120px] h-[50px]">
              <Image
                src="/assets/puntland_logo.svg"
                alt="Puntland Logo"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            <h2 className="xlg:text-[13px] text-[10px] print:text-lg font-semibold mt-2 leading-tight">
              Puntland State of Somalia <br /> Ministry of Energy Minerals &
              Water <br /> Office of the Minister
            </h2>
          </div>
          <div className="leading-tight">
            <h1 className="print:text-2xl xlg:text-lg text-[10px] font-bold mt-1">
              SHATIGA KA GANACSIGA MACDANTA
            </h1>
            <h1 className="print:text-2xl xlg:text-lg text-[10px] font-bold">
              MINING LICENSE
            </h1>
          </div>
        </div>

        {/* Description */}
        <p className="mt-0 print:mt-1 text-center print:text-xl xlg:text-lg text-[13px] text-nowrap">
          Wasaaradda Tamarta Macdanta iyo Biyaha waxay shatiga ganacsiga
          macdanta u oggolaatay <br />
          Ministry of Energy Minerals & Water has granted the mining license
        </p>

        {/* License Details */}
        <div className="mt-3 print:mt-4 capitalize space-y-2 xlg:text-lg text-[13px] print:text-[20px] print:px-32 xlg:px-18 px-12  print:leading-7 xlg:leading-none leading-4">
          <p>{licenseNumber}</p>
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
            <span className="font-semibold">
              {miningArea.join(", ")}
            </span>
          </p>
          <div className="flex justify-between mt-2">
            <p>
              Date of Issue:{" "}
              <span className="font-semibold">{issueDateFormatted}</span>
            </p>
            <p className="text-red-600">
              Date of Expiry:{" "}
              <span className="font-semibold">{expiryDateFormatted}</span>
            </p>
          </div>
        </div>

        {/* Official Seal */}
        <div className="flex items-center">
          <div className="absolute -bottom-2 left-0 right-0 print:left-18 print:bottom-14">
            <div className="relative w-[80px] h-[80px] print:w-[100px] print:h-[100px]">
              <Image
                src={ministerStampUrl || "/assets/moemw-logo.png"}
                alt="Official Seal"
                fill
                style={{ objectFit: "contain" }}
                unoptimized={!!ministerStampUrl}
              />
            </div>
          </div>

          {/* QR Code */}
          <div>
            {qrCodeUrl && (
              <div className="absolute xlg:-bottom-12 bottom-6 right-14 print:bottom-1 print:right-4">
                <div className="relative print:w-[140px] print:h-[140px] w-[30px] h-[30px]">
                  <div className="border-2 border-blue-200 p-[3px] bg-white flex items-center justify-center w-fit">
                    {/* Dynamic QR code generation based on license reference ID */}
                    <QRCodeSVG
                      value={`${config.env.apiEndpoint}/verify-license?ref_id=${licenseNumber}`}
                      size={80}
                      level="H"
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="absolute print:bottom-4 -bottom-4 left-0 right-0 text-center">
            <p className="font-medium leading-tight print:text-[20px] xlg:text-lg text-[13px] -mb-2">
              Wasiirka Wasaaradda Tamarta, Macdanta Biyaha <br />
              Ministry Of Energy Minerals and Water
            </p>
            <div className="flex justify-center">
              {signature ? (
                <div className="relative print:bottom-4 w-[140px] h-[70px] print:w-[230px] print:h-[110px]">
                  <Image
                    src={signerSignatureUrl || "/assets/signature.png"}
                    alt="Signature"
                    fill
                    className="object-contain"
                    unoptimized={!!signerSignatureUrl}
                  />
                </div>
              ) : (
                <div className="mt-12">
                  <p>Signature</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
