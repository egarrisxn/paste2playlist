"use client";

import { Disc3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { SpotifyProfile } from "@/lib/types";

interface HeaderProps {
  isConnected: boolean;
  profile: SpotifyProfile | null;
  onDisconnect: () => void;
}

export default function Header({
  isConnected,
  profile,
  onDisconnect,
}: HeaderProps) {
  const initial = (profile?.display_name?.trim()?.[0] ?? "U").toUpperCase();
  const avatarUrl = profile?.images?.[0]?.url;

  return (
    <header>
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-0.5">
          <Disc3 className="size-8 stroke-[2.5] text-[#1DB954]" />
          <h1 className="text-2xl leading-none font-black tracking-tighter text-shadow-lg">
            Paste<span className="text-[#1DB954]">2</span>Playlist
          </h1>
        </div>

        {isConnected && profile && (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage
                src={avatarUrl ?? "/placeholder.svg"}
                alt={profile.display_name}
              />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>

            <span className="hidden text-sm font-medium sm:inline">
              {profile.display_name}
            </span>

            <Button variant="ghost" size="sm" onClick={onDisconnect}>
              <LogOut className="size-4" />
              <span className="ml-2 hidden sm:inline">Disconnect</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
