import PublicFooter from "@/components/public-footer";

export default function PubliclLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-dvh w-full grid-rows-[1fr_auto]">
      <main className="grid px-4">{children}</main>
      <PublicFooter />
    </div>
  );
}
