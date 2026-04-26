"use server";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { sampleAnalysis } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { sampleAnalysisSchema } from "@/types/license-schema";
import {
  deleteSampleSchema,
  updateSampleAnalysisSchema,
  updateSampleSignatureSchema,
} from "@/types/sample.type";
import { eq } from "drizzle-orm";
import { and, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { dataDeletionBlockedResult } from "@/lib/data-retention";

export const RegisterSampleAnalysis = actionClient
  .schema(sampleAnalysisSchema)
  .action(
    async ({
      parsedInput: { name, passport_no, nationality, mineral_type, unit, amount },
    }) => {
      const session = await auth();

      if (!session || !session.user) {
        return redirect("/login");
      }

      const forbidden = await requireActionPermission(
        Permissions.SAMPLE_ANALYSIS_ACCESS,
      );
      if (forbidden) {
        return { error: forbidden };
      }

      const prefix = "MOEMW/DG";
      const now = new Date();

      const year = String(now.getFullYear()).slice(2); // e.g. "25"
      const startOfYear = new Date(now.getFullYear(), 0, 1);  // Jan 1st
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Dec 31st

      // Query how many records were created this year
      const records = await db
        .select()
        .from(sampleAnalysis)
        .where(
          and(
            gte(sampleAnalysis.created_at, startOfYear),
            lte(sampleAnalysis.created_at, endOfYear)
          )
        );

      // Serial number: count + 1
      const serial = String(records.length + 1).padStart(2, "0"); // "04", "05", ...

      const ref_id = `${prefix}/${serial}/${year}`;

      await db.insert(sampleAnalysis).values({
        ref_id,
        name,
        passport_no,
        nationality,
        mineral_type,
        unit,
        amount,
        
      });

      return { success: "Sample registered successfully" };
    }
  );

// Create the update sample action
export const UpdateSampleAnalysis = actionClient
  .schema(updateSampleAnalysisSchema)
  .action(async ({ parsedInput: { id, name, passport_no, nationality, mineral_type, unit, amount } }) => {
    const forbidden = await requireActionPermission(
      Permissions.SAMPLE_ANALYSIS_ACCESS,
    );
    if (forbidden) {
      return { error: forbidden };
    }

    try {
      // Update the sample analysis record where ref_id matches
      await db
        .update(sampleAnalysis)
        .set({
          name,
          passport_no,
          nationality,
          mineral_type,
          unit,
          amount,
          updated_at: new Date(), // Update the timestamp
        })
        .where(eq(sampleAnalysis.id, id));

      return { success: "Sample updated successfully" };
    } catch (error) {
      console.error("Error updating Sample:", error);
      return { error: "Failed to update Sample" };
    }
  });

// Create the delete license action
export const DeleteSample = actionClient
  .schema(deleteSampleSchema)
  .action(async ({ parsedInput: { id: _id } }) => {
    const forbidden = await requireActionPermission(
      Permissions.SAMPLE_ANALYSIS_ACCESS,
    );
    if (forbidden) {
      return { error: forbidden };
    }

    return dataDeletionBlockedResult();
  });

// Get sample by ref_id
export const GetSampleByRefId = async (ref_id: string) => {
  try {
    const sample = await db
      .select()
      .from(sampleAnalysis)
      .where(eq(sampleAnalysis.ref_id, ref_id))
      .limit(1);

    return sample.length > 0 ? sample[0] : null;
  } catch (error) {
    console.error("Error fetching sample:", error);
    return null;
  }
};


// Update Sample Analysis Signature
export const UpdateSampleSignature = actionClient
  .schema(updateSampleSignatureSchema)
  .action(async ({ parsedInput: { id, signature } }) => {
    const forbidden = await requireActionPermission(Permissions.SAMPLE_SIGNATURE);
    if (forbidden) {
      return { error: forbidden };
    }

    try {
      console.log("Updating Sample signature with ID:", id)
      console.log("New signature status:", signature)

      // Update only the signature field
      await db
        .update(sampleAnalysis)
        .set({
          signature: signature,
          updated_at: new Date(),
        })
        .where(eq(sampleAnalysis.id, id))

      const actionText = signature ? "signed" : "revoked"
      return { success: `Sample ${actionText} successfully` }
    } catch (error) {
      console.error("Error updating Sample signature:", error)
      return { error: `Failed to update Sample signature: ${error instanceof Error ? error.message : String(error)}` }
    }
  })
