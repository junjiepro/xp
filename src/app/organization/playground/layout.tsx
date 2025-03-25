import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground",
  description: "XP - playgrounds, projects and more.",
};

export default function OrganizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
