import Footer from "@/components/footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-dvh w-full grid-rows-[1fr_auto]">
      <main className="grid px-4">{children}</main>
      <Footer />
    </div>
  );
}
