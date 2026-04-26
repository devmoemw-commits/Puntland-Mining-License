
'use server';
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/database/drizzle";
import { permissions, roles, userPermissions, users } from "@/database/schema";
import { eq, inArray } from "drizzle-orm";
import bcrypt, { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AuthCredentials } from "@/types";
import { deleteUserSchema } from "@/types/user-schema";
import { actionClient } from "../safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { dataDeletionBlockedResult } from "@/lib/data-retention";
import {
  usersIdEmail,
  usersPasswordCheck,
} from "@/lib/data/users-select";
// const bcrypt = require("bcryptjs")


// Define the update data type based on your users schema
type UserUpdateData = {
  name?: string
  email?: string
  updatedAt?: Date
  password?: string
  role?: string
}


export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const { email, password } = params;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.log(error, "Signin error");
    return { success: false, error: "Signin error" };
  }
};

export const logout = async () => {
  await signOut({ redirectTo: "/" });
  revalidatePath("/");
}

const ALL_PERMISSION_CODES = new Set(Object.values(Permissions) as string[]);

/** Admin-only: create a user with a role and optional direct permission grants. */
export const signUp = async (params: AuthCredentials) => {
  const denied = await requireActionPermission(Permissions.USERS_MANAGE);
  if (denied) {
    return { success: false, error: denied };
  }

  const {
    name,
    email,
    password,
    role: roleParam,
    directPermissionCodes = [],
  } = params;

  const role = (roleParam ?? "OFFICER").trim().toUpperCase();

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: "User already exists" };
  }

  const [roleRow] = await db
    .select({ code: roles.code })
    .from(roles)
    .where(eq(roles.code, role))
    .limit(1);
  if (!roleRow) {
    return { success: false, error: "Invalid role. Create the role first or pick a valid one." };
  }

  for (const c of directPermissionCodes) {
    if (!ALL_PERMISSION_CODES.has(c)) {
      return { success: false, error: `Invalid permission code: ${c}` };
    }
  }

  const hashedPassword = await hash(password, 10);

  try {
    const [created] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
      })
      .returning({ id: users.id });

    if (!created?.id) {
      return { success: false, error: "Failed to create user" };
    }

    if (directPermissionCodes.length > 0) {
      const permRows = await db
        .select({ id: permissions.id, code: permissions.code })
        .from(permissions)
        .where(inArray(permissions.code, directPermissionCodes));

      if (permRows.length !== directPermissionCodes.length) {
        return {
          success: false,
          error:
            "Some permissions are missing in the database. Run: npm run db:seed:permissions",
        };
      }

      await db.insert(userPermissions).values(
        permRows.map((p) => ({
          userId: created.id,
          permissionId: p.id,
        })),
      );
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Signup error" + error };
  }
};

//signout function
export async function handleSignOut() {
  await signOut();
}

// Update user function with proper typing - FIXED VERSION
export const updateUser = async (
  userId: string,
  params: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    /** When provided, replaces direct grants in `user_permissions` for this user. */
    directPermissionCodes?: string[];
  },
): Promise<{ success: true } | { success: false; error: string }> => {
  const forbidden = await requireActionPermission(Permissions.USERS_MANAGE);
  if (forbidden) {
    return { success: false, error: forbidden };
  }

  const { name, email, password, role, directPermissionCodes } = params

  try {
    // Validate input
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    if (!name || name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    if (!email) {
      return { success: false, error: "Email is required" }
    }

    // Check if email is already taken by another user
    const existingUser = await db
      .select(usersIdEmail)
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return { success: false, error: "Email already exists" }
    }

    // Prepare update data with proper typing
    const updateData: UserUpdateData = {
      name: name.trim(),
      email,
      updatedAt: new Date(),
    }

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = await hash(password, 10)
    }

    if (role) {
      const code = role.trim().toUpperCase()
      const found = await db
        .select({ code: roles.code })
        .from(roles)
        .where(eq(roles.code, code))
        .limit(1)
      if (found.length === 0) {
        return { success: false, error: "Invalid role specified" }
      }
      updateData.role = found[0].code
    }

    await db.update(users).set(updateData).where(eq(users.id, userId))

    if (directPermissionCodes !== undefined) {
      for (const c of directPermissionCodes) {
        if (!ALL_PERMISSION_CODES.has(c)) {
          return { success: false, error: `Invalid permission code: ${c}` };
        }
      }
      await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
      if (directPermissionCodes.length > 0) {
        const permRows = await db
          .select({ id: permissions.id, code: permissions.code })
          .from(permissions)
          .where(inArray(permissions.code, directPermissionCodes));
        if (permRows.length !== directPermissionCodes.length) {
          return {
            success: false,
            error:
              "Some permissions are missing in the database. Run: npm run db:seed:permissions",
          };
        }
        await db.insert(userPermissions).values(
          permRows.map((p) => ({
            userId,
            permissionId: p.id,
          })),
        );
      }
    }

    revalidatePath("/users")
    revalidatePath(`/users/${userId}`)

    return { success: true }
  } catch (error) {
    console.error("Update user error:", error)
    return { success: false, error: "Update error: " + error }
  }
}
// Update user profile function
export const updateUserProfile = async (userId: string, data: { name: string }) => {
  try {
    // Validate input
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    // Update user in database
    await db
      .update(users)
      .set({
        name: data.name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    // Revalidate the profile page to reflect changes
    revalidatePath("/user/profile")

    return { success: true }
  } catch (error) {
    console.error("Update user error:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

/** Save ImageKit URL for the user’s certificate signature (own profile, or admins with USERS_MANAGE). */
export const updateUserSignatureImage = async (
  userId: string,
  signatureImageUrl: string | null,
): Promise<{ success: true } | { success: false; error: string }> => {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const isSelf = session.user.id === userId;
  if (!isSelf) {
    const forbidden = await requireActionPermission(Permissions.USERS_MANAGE);
    if (forbidden) {
      return { success: false, error: forbidden };
    }
  }

  try {
    await db
      .update(users)
      .set({
        signatureImageUrl: signatureImageUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    revalidatePath("/user/profile");
    revalidatePath("/users");
    revalidatePath("/licenses");
    return { success: true };
  } catch (error) {
    console.error("Update signature image error:", error);
    return { success: false, error: "Failed to save signature" };
  }
};

// Update user password function
export const updateUserPassword = async (userId: string, data: { currentPassword: string; newPassword: string }) => {
  try {
    // Validate input
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }

    if (!data.currentPassword || !data.newPassword) {
      return { success: false, error: "Current and new passwords are required" }
    }

    if (data.newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters" }
    }

    // Get the user to verify current password
    const userResult = await db
      .select(usersPasswordCheck)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return { success: false, error: "User not found" }
    }

    const user = userResult[0]

    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password as string)

    if (!isPasswordValid) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Hash the new password
    const hashedPassword = await hash(data.newPassword, 10)

    // Update the password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { success: false, error: "Failed to update password" }
  }
}


// Create the delete license action
export const DeleteUser = actionClient
  .schema(deleteUserSchema)
  .action(async ({ parsedInput: { id: _id } }) => {
    const forbidden = await requireActionPermission(Permissions.USERS_MANAGE);
    if (forbidden) {
      return { error: forbidden };
    }

    return dataDeletionBlockedResult();
  });