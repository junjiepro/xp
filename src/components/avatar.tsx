import {
  AvatarFallback as Fallback,
} from "@/components/ui/avatar"

export function AvatarFallback({ className, label }: { className?: string; label: string }) {
  return <Fallback className={className}>{label.split(" ").map((word) => word ? word[0].toUpperCase() : '').slice(0, 2).join("")}</Fallback>
}