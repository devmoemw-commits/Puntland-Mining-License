import { z } from "zod";

// Delete User schema
export const deleteUserSchema = z.object({
  id: z.string().min(1, "User  ID is required"),
})