import { Suspense } from "react";
import UnsubscribeComponent from "./components/UnsubscribeComponent";
import { Loader2 } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <UnsubscribeComponent />
    </Suspense>
  );
}
