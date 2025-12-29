import { ThemeToggle } from "./theme-toggle";

export default function RootHeader() {
  return (
    <header className="absolute top-4 right-4 z-50">
      <ThemeToggle />
    </header>
  );
}
