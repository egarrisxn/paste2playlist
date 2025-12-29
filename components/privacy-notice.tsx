import { Shield } from "lucide-react";

export default function PrivacyNotice() {
  return (
    <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
      <div className="flex items-start gap-2">
        <Shield className="mt-0.5 size-4 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium">Privacy</p>
          <p>
            Your Spotify tokens are stored locally in your browser. No data is
            sent to any server other than Spotify. You can disconnect anytime to
            clear all stored data.
          </p>
        </div>
      </div>
    </div>
  );
}
