import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEXUS | Sustainable Data-Center Operations",
  description: "NEXUS helps infrastructure teams monitor, explain, simulate, and optimize sustainable data-center operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="bg-background">
      <body>{children}</body>
    </html>
  );
}
