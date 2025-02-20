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
import { Loader2, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const signUpSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["Customer", "Business Owner"], { message: "Please select an account type" }),
  businessName: z.string().optional(),
  location: z.string().optional(),
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
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileChange = (e) => {
    //setImage(e.target.files[0]);
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    };
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleUpload = async (file) => {
    if (!file) return "";
  
    try {
      const formData = new FormData();
      formData.append("file", file);
  
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
  
      if (!res.ok) throw new Error(data.error || "Upload failed");
  
      return data.url;
    } catch (error) {
      console.error("Upload error:", error.message);
      toast.error("Image upload failed");
      return "";
    }
  };  

  const onSubmit = async (data) => {
    setLoading(true);

    const { name, email, password, role, businessName, location } = data;

    let imageUrl = "";
    if (image) {
      try {
        imageUrl = await handleUpload(image);
      } catch (error) {
        toast.error("Image upload failed");
        setLoading(false);
        return;
      }
    }

    // Sign up user with authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      toast.error(authError.message);
      return;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      setLoading(false);
      toast.error("User ID not found");
      return;
    }

    try {
      const { error: userInsertError } = await supabase.from("users").insert([
        { name, email, role, owner_id: role === "Business Owner" ? userId : null },
      ]);

      if (userInsertError) {
        throw userInsertError;
      }

      if (role === "Business Owner") {
        const { error: restaurantInsertError } = await supabase.from("restaurants").insert([
          { name: businessName, location, restaurant_image: imageUrl, owner_id: userId },
        ]);

        if (restaurantInsertError) {
          throw restaurantInsertError;
        }
      }

      toast.success("Check your email for a confirmation link!");
      router.push("/signin");
    } catch (error) {
        toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <Toaster />
      
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-50"
        style={{ backgroundImage: "url('/images/signup.jpeg')" }}
      />
      
      <div className="relative z-10 mt-8 sm:mt-12 text-4xl sm:text-5xl font-serif italic text-white opacity-90">
        <h1 className="text-center">SerenePath</h1>
      </div>

      <div className="relative z-10 flex justify-center w-full">
        <Card className="w-full max-w-md p-6 mx-4 sm:mx-0 mt-10 sm:mt-4 transition-all duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input {...register("name")} type="text" placeholder="Full Name" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>

              <div>
                <Input {...register("email")} type="email" placeholder="Email" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>

              <div>
                <Input {...register("password")} type="password" placeholder="Password" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 pb-1">Account Type</label>
                <select {...register("role")} className="w-full text-sm sm:text-base px-3 py-2 border rounded bg-white text-gray-500">
                  <option value="">Select Account Type</option>
                  <option value="Customer">Customer</option>
                  <option value="Business Owner">Business Owner</option>
                </select>
                {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
              </div>

              {selectedRole === "Business Owner" && (
                <div className="transition-all duration-300 ease-in-out">
                  <div>
                    <Input {...register("businessName")} type="text" placeholder="Business Name" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                    {errors.businessName && <p className="text-red-500 text-xs">{errors.businessName.message}</p>}
                  </div>
                  <div>
                    <Input {...register("location")} type="text" placeholder="Location" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                    {errors.location && <p className="text-red-500 text-xs">{errors.location.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Business Image</label>
                    <div className="flex flex-col items-center gap-3 p-4 border border-gray-600 rounded-lg bg-gray-700">
                      {!imagePreview && (
                        <>
                          <Input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="fileUpload" />
                          <label htmlFor="fileUpload" className="px-4 py-2 text-sm bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
                            Upload Image
                          </label>
                        </>
                      )}
                      {imagePreview && (
                        <div className="relative mt-2">
                          <img src={imagePreview} alt="Uploaded Preview" className="w-24 h-24 rounded-md object-cover border border-gray-500" />
                          <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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