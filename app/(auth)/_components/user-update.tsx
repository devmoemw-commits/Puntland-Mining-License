"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, X } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import { updateUserSchema } from "@/lib/validations";
import { updateUser } from "@/lib/actions/auth.action";
import type { TUsers } from "@/types";
import type { RoleRow } from "@/lib/data/get-roles";
import type { PermissionCatalogItem } from "@/components/users/role-permissions-matrix";
import type { z } from "zod";

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

type PasswordRequirements = {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
};

interface UserUpdateFormProps {
  user: TUsers;
  roles: RoleRow[];
  permissionCatalog: PermissionCatalogItem[];
  initialDirectPermissionCodes: string[];
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${met ? "text-green-600" : "text-gray-500"}`}
    >
      {met ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-gray-400" />
      )}
      <span>{text}</span>
    </div>
  );
}

export default function UserUpdateForm({
  user,
  roles,
  permissionCatalog,
  initialDirectPermissionCodes,
}: UserUpdateFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] =
    useState<PasswordRequirements>({
      minLength: false,
      hasUppercase: false,
      hasNumber: false,
      hasSymbol: false,
    });

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "OFFICER",
      directPermissionCodes: initialDirectPermissionCodes,
    },
  });

  const password = form.watch("password");
  const selectedDirect = form.watch("directPermissionCodes") ?? [];

  useEffect(() => {
    if (password) {
      setPasswordRequirements({
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSymbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
      });
    } else {
      setPasswordRequirements({
        minLength: false,
        hasUppercase: false,
        hasNumber: false,
        hasSymbol: false,
      });
    }
  }, [password]);

  function toggleDirectPermission(code: string, checked: boolean) {
    const cur = new Set(form.getValues("directPermissionCodes") ?? []);
    if (checked) cur.add(code);
    else cur.delete(code);
    form.setValue("directPermissionCodes", Array.from(cur), {
      shouldValidate: true,
    });
  }

  const onSubmit = async (data: UpdateUserFormData) => {
    const directExtra = form.getValues("directPermissionCodes") ?? [];
    const result = await updateUser(user.id, {
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role,
      directPermissionCodes: directExtra,
      ...(data.password?.trim()
        ? { password: data.password }
        : {}),
    });

    if (!result.success) {
      if (result.error.includes("Email already exists")) {
        form.setError("email", { type: "manual", message: result.error });
      } else if (result.error.toLowerCase().includes("name")) {
        form.setError("name", { type: "manual", message: result.error });
      } else if (result.error.toLowerCase().includes("role")) {
        form.setError("role", { type: "manual", message: result.error });
      } else {
        toast.error(result.error);
      }
      return;
    }

    toast.success("User updated successfully!");
    form.setValue("password", "");
    router.push("/users");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-1">Edit user</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {user.name} · {user.email}
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Permissions from this role apply automatically. Add extra direct grants below.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <Label>Additional permissions (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Direct grants on top of the role. Effective access is the union of role and direct
              permissions.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto rounded-md border p-3">
              {permissionCatalog.map((p) => (
                <label
                  key={p.code}
                  className="flex items-start gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDirect.includes(p.code)}
                    onCheckedChange={(c) =>
                      toggleDirectPermission(p.code, c === true)
                    }
                  />
                  <span>
                    <span className="font-mono text-xs">{p.code}</span>
                    <span className="block text-muted-foreground text-xs">
                      {p.label}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password (optional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Leave blank to keep current password"
                      {...field}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </FormControl>

                {password ? (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Password must contain:
                    </p>
                    <div className="space-y-2">
                      <RequirementItem
                        met={passwordRequirements.minLength}
                        text="At least 8 characters"
                      />
                      <RequirementItem
                        met={passwordRequirements.hasUppercase}
                        text="One uppercase letter (A-Z)"
                      />
                      <RequirementItem
                        met={passwordRequirements.hasNumber}
                        text="One number (0-9)"
                      />
                      <RequirementItem
                        met={passwordRequirements.hasSymbol}
                        text="One special character (!@#$%^&*)"
                      />
                    </div>
                  </div>
                ) : null}

                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-xs text-muted-foreground">
            Created {new Date(user.createdAt).toLocaleString()} · Last updated{" "}
            {new Date(user.updatedAt).toLocaleString()}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="sm:flex-1"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
