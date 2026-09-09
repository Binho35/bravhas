"use client";

import { useSharedAuth } from "../components/AuthProvider";

export function useAuth() {
  return useSharedAuth();
}
