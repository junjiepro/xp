"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const playgrounds = [
  {
    route: "generate-image",
    name: "Generate Images",
    img: "/generate-image.png",
    icon: <ImageIcon />,
  },
];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const organizationId = searchParams.get("organizationId");

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {playgrounds.map((p) => (
            <Card
              key={p.route}
              className="hover:cursor-pointer hover:shadow-md"
              onClick={() => {
                router.push(
                  `/organization/playground/${p.route}?organizationId=${organizationId}`
                );
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{p.name}</CardTitle>
                {p.icon}
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-md">
                  <Image
                    className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-[5/3]"
                    alt={p.name}
                    src={p.img}
                    width={512}
                    height={512}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
