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
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const { email, password } = data;

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      alert(error.message);
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
        <Card className="w-full max-w-md p-6">
            <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                <Input {...register("email")} type="email" placeholder="Email" className="w-full" />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
                <div>
                <Input {...register("password")} type="password" placeholder="Password" className="w-full" />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>
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