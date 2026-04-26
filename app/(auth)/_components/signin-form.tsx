"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { signInSchema } from "@/lib/validations"
import { signInWithCredentials } from "@/lib/actions/auth.action"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const onSubmit = async (data: any) => {
    const result = await signInWithCredentials(data)
    setLoading(true)

    if (!result.success) {
      form.setError("email", { type: "manual", message: result.error })
    } else {
      setLoading(false)
      toast("Logged in successfully")
      window.location.reload();
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-8 shadow-xl">
        <div className="flex items-center justify-center">
          <Image src="/assets/puntland_logo.svg" alt="Puntland Coat of Arms" width={130} height={100} />
        </div>
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-200">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-200">Please sign in to your account to continue</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 dark:text-gray-200">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Enter your email"
                        className="border-gray-300 py-6 pl-10 focus:border-purple-500 focus:ring-purple-500"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-gray-700 dark:text-gray-200">Password</FormLabel>
                    <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-gray-300 py-6 pl-10 pr-10 focus:border-purple-500 focus:ring-purple-500"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full  bg-gradient-to-r from-primary to-indigo-700 py-6 text-white transition-all duration-200 hover:bg-purple-700 cursor-pointer"
            >{loading ? 'loading...': 'Login'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default SignInForm
