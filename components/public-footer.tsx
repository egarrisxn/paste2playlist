import { Heart } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="mx-auto flex w-full items-center justify-center border-t-2 border-border/30 p-4">
      <div className="group flex items-center justify-center space-x-1 text-sm font-semibold tracking-tight sm:text-base">
        <span>Made with</span>
        <Heart
          size={16}
          className="fill-primary/50 text-primary group-hover:fill-primary/80"
        />
        <span>by</span>
        <a
          href="https://egxo.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="relative cursor-pointer transition-colors group-hover:text-primary"
        >
          egxo.dev
          <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </a>
      </div>
    </footer>
  );
}
