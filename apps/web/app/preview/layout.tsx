import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview — AIUI",
  description: "Live React preview of the builder document (registry-driven)",
};

export default function PreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
