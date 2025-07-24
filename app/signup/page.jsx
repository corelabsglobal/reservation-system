"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GoogleSignInButton from "../components/structure/googleSignIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LocationSearch } from "../components/structure/LocationSearch";

const signUpSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  role: z.enum(["Customer", "Business Owner"], { message: "Please select an account type" }),
  businessName: z.string().optional(),
  location: z.string().min(1, { message: "Location is required" }).optional(),
  phone: z.string().optional(),
}).refine((data) => {
  if (data.role === "Business Owner") {
    return !!data.businessName && !!data.location && !!data.phone;
  }
  return true;
}, {
  message: "Business Name, Location, and Phone are required for Business Owners",
  path: ["businessName", "location", "phone"],
});

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [existingUserCheckDone, setExistingUserCheckDone] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const selectedRole = watch("role");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const generateRestaurantUrl = (name) => {
    const cleanedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomNumbers = Math.floor(10 + Math.random() * 90);
    return `${cleanedName}-${randomNumbers}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
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
  
      if (!res.ok) throw new Error(data.error || "Upload failed ");
  
      return data.url;
    } catch (error) {
      console.error("Upload error:", error.message);
      toast.error("Image upload failed");
      return "";
    }
  };  

  const saveGoogleUser = async (user) => {
    try {
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();
  
      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }
  
      if (!existingUser) {
        const { error: insertError } = await supabase.from("users").insert([
          {
            name: user.user_metadata.full_name || user.email,
            email: user.email,
            role: "Customer",
            owner_id: user.id,
          },
        ]);
  
        if (insertError) throw insertError;
      }
  
      toast.success("Signed in successfully!");
      router.push("/");
    } catch (error) {
      console.error("Google Sign-in Error:", error.message);
      toast.error("Failed to save user data.");
    } finally {
      setLoading(false);
    }
  };  

  const handleGoogleSignIn = async () => {
    setLoading(true);
  
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://uchnyrxklpmkqraeurng.supabase.co/auth/v1/callback",
      },
    });
  
    if (error) {
      toast.error("Google sign-in failed: " + error.message);
      setLoading(false);
      return;
    }
  
    // Wait for user session to be established
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (user) {
      await saveGoogleUser(user);
      toast.success("Signed in successfully! Note: Only client accounts can be created.");
    }
  };   

  const onSubmit = async (data) => {
    setLoading(true);

    const { name, email, password, role, businessName, location, phone } = data;

    // Check if user already exists in auth and users table
    const { data: { user: existingAuthUser }, error: authCheckError } = await supabase.auth.getUser();
    const { data: existingDbUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAuthUser || existingDbUser) {
      setLoading(false);
      toast.error('An account with this email already exists');
      return;
    }

    if (role === "Business Owner" && !image) {
      toast.error("Business Image is required");
      setLoading(false);
      return;
    }

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
      // Insert user data with phone number if business owner
      const userData = { 
        name, 
        email, 
        role, 
        owner_id: userId 
      };
      
      if (role === "Business Owner") {
        userData.phone = phone;
      }

      const { error: userInsertError } = await supabase.from("users").insert([userData]);

      if (userInsertError) {
        throw userInsertError;
      }

      if (role === "Business Owner") {
        const restaurantUrl = generateRestaurantUrl(businessName);
        const { error: restaurantInsertError } = await supabase.from("restaurants").insert([
          { 
            name: businessName, 
            location, 
            restaurant_image: imageUrl, 
            owner_id: userId,
            url: restaurantUrl,
            phone 
          },
        ]);

        if (restaurantInsertError) {
          throw restaurantInsertError;
        }

        setShowVerificationModal(true);
      } else {
        toast.success("Check your email for a confirmation link!");
        router.push("/signin");
      }

    } catch (error) {
        toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        router.push("/");
      }
      setExistingUserCheckDone(true);
    };

    checkUser();
  }, []);

  if (!existingUserCheckDone) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <Toaster />
      
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed opacity-50"
        style={{ backgroundImage: "url('/images/signup.jpeg')" }}
      />
      
      <div className="relative z-10 mt-8 sm:mt-12 text-4xl sm:text-5xl font-serif italic text-white opacity-90">
        <h1 className="text-center">DanLoski</h1>
      </div>

      <div className="relative z-10 flex justify-center w-full">
        <Card className="w-full max-w-md p-6 mx-4 sm:mx-0 mt-10 sm:mt-4 transition-all duration-300 ease-in-out">
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleSignInButton onClick={handleGoogleSignIn} />
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
                <div className="transition-all duration-300 ease-in-out space-y-4">
                  <div>
                    <Input {...register("businessName")} type="text" placeholder="Business Name" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                    {errors.businessName && <p className="text-red-500 text-xs">{errors.businessName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 pb-1">Business Location</label>
                    <LocationSearch
                      value={watch("location")}
                      onChange={(value) => setValue("location", value, { shouldValidate: true })}
                      register={register}
                      errors={errors}
                    />
                  </div>
                  <div>
                    <Input {...register("phone")} type="tel" placeholder="Phone Number" className="w-full text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4" />
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
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
                    {!image && selectedRole === "Business Owner" && (
                      <p className="text-red-500 text-xs mt-1">Business Image is required</p>
                    )}
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
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent className="sm:max-w-md bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Account Verification</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-gray-300">
            Thank you for signing up as a Business Owner! DanLoski needs <strong>7 business days</strong> to verify your account. Once verified, your account will become fully active, and users will be able to book reservations from you.
          </DialogDescription>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                setShowVerificationModal(false);
                router.push("/signin");
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}