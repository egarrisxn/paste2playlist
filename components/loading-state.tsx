import { Loader2, Disc3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoadingState() {
  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#1DB954]/10">
            <Disc3 className="size-6 text-[#1DB954]" />
          </div>
          <CardTitle>Finishing Spotify Login</CardTitle>
          <CardDescription>
            Please wait while we complete your authentication...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="size-8 animate-spin text-[#1DB954]" />
        </CardContent>
      </Card>
    </div>
  );
}
