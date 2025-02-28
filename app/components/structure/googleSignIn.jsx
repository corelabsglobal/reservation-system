import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

export default function GoogleSignInButton({ onClick }) {
  return (
    <Button
      className="w-full mb-4 flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-200"
      onClick={onClick}
    >
      <FcGoogle className="text-xl" />
      Google Sign In
    </Button>
  );
}
