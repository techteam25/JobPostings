import { useUserSession } from "@/app/(main)/hooks/use-user-session";

export const useAuthenticationStatus = () => {
  const { data: session } = useUserSession();
  return { isAuthenticated: !!session?.data?.user };
};
