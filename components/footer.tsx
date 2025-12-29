import ThemeToggle from "@/components/theme-toggle";

export default function Footer() {
  return (
    <footer className="mx-auto flex w-full items-center justify-center gap-2.5 p-4">
      <div className="flex items-center justify-center space-x-1 font-semibold tracking-tight">
        <span>Made with</span>
        <ThemeToggle />
        <span>by</span>
        <a
          href="https://egxo.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative cursor-pointer"
        >
          egxo.dev
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </a>
      </div>
    </footer>
  );
}
