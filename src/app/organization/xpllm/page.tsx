import { LLM } from "@/components/llm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "XP LLM",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <LLM />
  )
}