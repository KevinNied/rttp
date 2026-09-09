"use client";

import { useCallback, useEffect, useState } from "react";

import { User } from "@/lib/rttp-data";

import { redirectForRole } from "@/application/navigation/routes";

export type AppNavigation = {
  pathname: string;
  navigate: (path: string) => void;
  replaceNavigate: (path: string) => void;
};

export function useAppNavigation(): AppNavigation {
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, "", path);
    setPathname(path);
  }, []);

  const replaceNavigate = useCallback((path: string) => {
    window.history.replaceState(null, "", path);
    setPathname(path);
  }, []);

  useEffect(() => {
    function onPopState() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return { pathname, navigate, replaceNavigate };
}

export function useRoleRedirect({
  hydrated,
  pathname,
  user,
  replaceNavigate,
}: {
  hydrated: boolean;
  pathname: string;
  user: User | null;
  replaceNavigate: (path: string) => void;
}) {
  useEffect(() => {
    if (!hydrated) return;
    const redirect = redirectForRole(pathname, user?.role ?? null);
    if (!redirect) return;
    const timeout = window.setTimeout(() => replaceNavigate(redirect), 0);
    return () => window.clearTimeout(timeout);
  }, [hydrated, pathname, replaceNavigate, user]);
}
