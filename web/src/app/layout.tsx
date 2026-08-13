import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coolara | Sustainability Guardian",
  description: "A decision-support command center for sustainable data-center operations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
