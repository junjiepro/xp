"use client"

import { Mail } from "@/components/mail";
import { accounts, mails } from "@/components/data";

export default function Home() {
  const defaultLayout = undefined
  const defaultCollapsed = undefined
  return (
    <Mail accounts={accounts}
      mails={mails}
      defaultLayout={defaultLayout}
      defaultCollapsed={defaultCollapsed}
      navCollapsedSize={4}>s</Mail>
  );
}
