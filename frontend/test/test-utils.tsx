import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type ReactElement, type ReactNode } from "react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}

function customRender(ui: ReactElement, options?: RenderOptions) {
  const { wrapper: UserWrapper, ...rest } = options ?? {};

  const Wrapper = UserWrapper
    ? ({ children }: { children: ReactNode }) => (
        <AllProviders>
          <UserWrapper>{children}</UserWrapper>
        </AllProviders>
      )
    : AllProviders;

  return render(ui, { wrapper: Wrapper, ...rest });
}

export * from "@testing-library/react";
export { customRender as render };
