import { Disc3 } from "lucide-react";

export default function Hero() {
  return (
    <div className="space-y-8">
      <div className="space-y-4 py-8 text-center">
        <div className="mb-4 inline-flex size-20 items-center justify-center rounded-full bg-[#1DB954]/10">
          <Disc3 className="size-10 animate-spin-slow text-[#1DB954]" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Turn your album list into a playlist!
        </h2>
        <p className="mx-auto max-w-md text-base text-muted-foreground sm:text-lg">
          Paste a list of albums, and we will create a Spotify playlist with all
          the tracks.
        </p>
      </div>
    </div>
  );
}
