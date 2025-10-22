import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth";

export const useUserSession = () => {
  const { data, error, isPending } = useQuery({
    queryKey: ["get-user-session"],
    queryFn: async () => await authClient.getSession(),
  });

  return { data, error, isPending };
};
