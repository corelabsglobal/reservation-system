"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const signUpSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["Customer", "Business Owner"], { message: "Please select an account type" }),
  businessName: z.string().min(1, { message: "Business Name is required" }).optional(),
  location: z.string().min(1, { message: "Location is required" }).optional(),
}).refine((data) => {
  if (data.role === "Business Owner") {
    return !!data.businessName && !!data.location;
  }
  return true;
}, {
  message: "Business Name and Location are required for Business Owners",
  path: ["businessName", "location"],
});

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    setLoading(true);
    const { name, email, password, role } = data;

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
        setLoading(false);
        alert(error.message);
        return;
      }
  
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: user.user.id, name, email, role }]);
  
      setLoading(false);
  
      if (insertError) {
        alert(insertError.message);
      } else {
        alert("Check your email for a confirmation link!");
        router.push("/signin");
      }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-50"
        style={{ backgroundImage: "url('/images/signup.jpeg')" }}
      />
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="absolute top-14 text-5xl font-serif italic text-white opacity-90">
          <h1 className="text-center">SerenePath</h1>
        </div>
        <Card className="w-full max-w-md p-6 mx-4 sm:mx-0 mt-20 sm:mt-1">
            <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <Input {...register("name")} type="text" placeholder="Name" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                <div>
                    <Input {...register("email")} type="email" placeholder="Email" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
                <div>
                    <Input {...register("password")} type="password" placeholder="Password" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                    {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium">Account Type</label>
                    <select {...register("role")} className="w-full text-sm sm:text-base px-3 py-2 border rounded bg-white text-gray-500">
                        <option value="">Select Account Type</option>
                        <option value="Customer">Customer</option>
                        <option value="Business Owner">Business Owner</option>
                    </select>
                    {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
                </div>
                {selectedRole === "Business Owner" && (
                    <>
                    <div>
                        <Input {...register("businessName")} type="text" placeholder="Business Name" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                        {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName.message}</p>}
                    </div>
                    <div>
                        <Input {...register("location")} type="text" placeholder="Location" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                        {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                    </div>
                    </>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
                </Button>
            </form>
            <p className="mt-4 text-center text-gray-400">
                Already have an account? <a href="/signin" className="text-blue-400">Sign in</a>
            </p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}