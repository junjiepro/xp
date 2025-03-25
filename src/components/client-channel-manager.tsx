'use client';

import dynamic from 'next/dynamic';

const ChannelManager = dynamic(() => import("./channel-manager"), {
  ssr: false,
});

export default function ClientChannelManager({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChannelManager>{children}</ChannelManager>;
}
