import Organization from "@/components/organization";

export default function OrganizationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Organization>{children}</Organization>
}