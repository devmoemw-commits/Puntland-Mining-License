"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Camera, Mail, User, Lock, Shield } from "lucide-react";
import {
  updateUserProfile,
  updateUserPassword,
} from "@/lib/actions/auth.action";
import { ProfileSignatureUpload } from "@/components/profile/profile-signature-upload";
import Image from "next/image";
import type { Session } from "next-auth"
import { useSession } from "next-auth/react"

// Form schema - removed email since it doesn't need to be updated
const personalInfoSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function UserProfile({
  session,
  signatureImageUrl,
}: {
  session: Session;
  signatureImageUrl: string | null;
}) {
  const { update } = useSession() // <-- get the update function
  
  // Format the join date
  const joinDate = new Date(session?.user?.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Personal info form - only includes name now
  const personalInfoForm = useForm<z.infer<typeof personalInfoSchema>>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: session?.user?.name,
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle personal info form submission
  const onPersonalInfoSubmit = async (
    data: z.infer<typeof personalInfoSchema>
  ) => {
    try {
      const result = await updateUserProfile(session?.user?.id, {
        name: data.name,
      });

      if (result.success) {
        toast.success("Profile updated successfully");
        await update()
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    }
  };

  // Handle password form submission
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      const result = await updateUserPassword(session?.user?.id, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.success) {
        toast.success("Password updated successfully");
        passwordForm.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-md">
              {session?.user?.image ? (
                <Image
                  src={session?.user?.image || "/placeholder.svg"}
                  alt={session?.user?.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `/placeholder.svg?height=96&width=96&query=profile`;
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-purple-100 text-2xl font-bold text-primary">
                  {session?.user?.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-sm"
            >
              <Camera className="h-4 w-4" />
              <span className="sr-only">Change profile picture</span>
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{session?.user?.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{session?.user?.email}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                {session?.user?.role}
              </div>
              <div className="text-xs text-gray-500">Joined {joinDate}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Personal Information Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...personalInfoForm}>
              <form
                onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={personalInfoForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            className="pl-10"
                            placeholder="Your full name"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email field - disabled and not part of the form submission */}
                <div className="space-y-2">
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-10 bg-gray-50 text-gray-500"
                      value={session?.user?.email}
                      disabled
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700 cursor-pointer"
                >
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificate signature</CardTitle>
            <CardDescription>
              Your personal signature (PNG/JPG) for printed licenses. Stored on
              ImageKit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session?.user?.id ? (
              <ProfileSignatureUpload
                userId={session.user.id}
                initialUrl={signatureImageUrl ?? ""}
              />
            ) : null}
          </CardContent>
        </Card>

        {/* Password Update Form */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            className="pl-10"
                            type="password"
                            placeholder="Your current password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              className="pl-10"
                              type="password"
                              placeholder="Your new password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              className="pl-10"
                              type="password"
                              placeholder="Confirm new password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-indigo-700 cursor-pointer"
                >
                  Update Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
