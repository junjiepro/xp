import GenerateImage from "@/components/generate-image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Images",
  description: "XP - playgrounds, projects and more.",
};

export default function DashboardPage() {
  return <GenerateImage />;
}
