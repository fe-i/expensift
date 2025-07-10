import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

export const { signIn, signOut, deleteUser, getSession, useSession } =
  createAuthClient({
    baseURL: env.NEXT_PUBLIC_BASE_URL,
  });
