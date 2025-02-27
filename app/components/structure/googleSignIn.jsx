import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

export default function GoogleSignInButton({ onClick }) {
  return (
    <Button
      className="w-full mb-4 flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-xl shadow-md hover:bg-gray-100 hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <FcGoogle className="text-2xl" />
      Google Sign Up
    </Button>
  );
}
