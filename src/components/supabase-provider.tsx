"use client";

import { createContext, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSetUserProfile } from "@/hooks/use-user-profile";
import {
  useOrganizations,
  useSetOrganizations,
  useSetRoles,
} from "@/hooks/use-organizations";
import { toast } from "sonner";
import { useSession, useSetSession } from "@/hooks/use-session";
import { useSetDevices } from "@/hooks/use-devices";
import { UserNav } from "./user-nav";
import { Search } from "./search";
import { MainNav } from "./main-nav";
import OrganizationSwitcher from "./organization-switcher";
import xpServer from "@/lib/applications/server/xp-server";

const Context = createContext<undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();
  const setSession = useSetSession();
  const setUserProfile = useSetUserProfile();
  const setOrganizations = useSetOrganizations();
  const organizations = useOrganizations();
  const setRoles = useSetRoles();
  const setDevices = useSetDevices();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const {
      data: { subscription },
    } = xpServer.onAuthStateChange((_, _session) => {
      if (!_session?.user && !pathname.startsWith("/auth/")) {
        router.replace("/auth/sign-in");
        setUserProfile(null);
        setOrganizations([]);
        setRoles([]);
        setSession(_session);
      } else if (_session?.access_token !== session?.access_token) {
        if (!pathname.startsWith("/auth/")) {
          // router.refresh()
        } else {
          router.replace("/");
        }
        if (_session?.user.id && _session?.user.id !== session?.user.id) {
          xpServer
            .getUserProfile(_session?.user.id)
            .then((data) => {
              if (data) {
                setUserProfile(data);
              } else {
                setUserProfile(null);
              }
            })
            .catch((error) => {
              toast.error(error.message);
              console.log(error);
            });
          xpServer
            .getOrganizationsByUserId(_session?.user.id)
            .then((data) => {
              if (data) {
                setOrganizations(data);
              } else {
                setOrganizations([]);
              }
            })
            .catch((error) => {
              toast.error(error.message);
              console.log(error);
            });
        }
        setSession(_session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, session, pathname]);

  useEffect(() => {
    if (organizations && organizations.length && session?.user.id)
      xpServer
        .getRoleWithOrganizationsByUserId(session.user.id)
        .then((data) => {
          if (data) {
            setRoles(data);
          } else {
            setRoles([]);
          }
        })
        .catch((error) => {
          toast.error(error.message);
          console.log(error);
        });
  }, [organizations, session]);

  const refreshDevice = useCallback(() => {
    xpServer
      .getCurrentDevices()
      .then((data) => {
        if (data) {
          setDevices(data);
        }
      })
      .catch((error) => {
        toast.error(error.message);
        console.log(error);
      });
  }, [setDevices]);
  useEffect(() => {
    if (session?.user.id) {
      xpServer
        .createOrUseDevice(session.user.id)
        .then(() => {
          refreshDevice();
        })
        .catch((error) => {
          toast.error(error.message);
          console.log(error);
        });
    }
  }, [session?.user?.id]);

  return (
    <Context.Provider value={undefined}>
      {session?.user ? (
        <div className="flex-col flex">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <OrganizationSwitcher />
              <MainNav className="hidden md:block mx-6" />
              <div className="ml-auto flex items-center space-x-4">
                <Search />
                <UserNav />
              </div>
            </div>
          </div>
          <>{children}</>
        </div>
      ) : (
        <>{children}</>
      )}
    </Context.Provider>
  );
}
