import Inspector from "@/components/applications/inspector";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inspector",
  description: "XP - playgrounds, projects and more.",
};

export default function DashboardPage() {
  return <Inspector />;
}
