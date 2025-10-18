import { AlertCircle, Loader2 } from "lucide-react";
import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: AnyFieldApi }) {
  const hasError = field.state.meta.isTouched && !field.state.meta.isValid;
  const isValidating = field.state.meta.isValidating;

  if (!hasError && !isValidating) return null;

  return (
    <div className="mt-1.5 flex items-start gap-1.5">
      {isValidating && (
        <>
          <Loader2 className="text-muted-foreground mt-0.5 h-3.5 w-3.5 animate-spin" />
          <p className="text-muted-foreground text-xs">Validating...</p>
        </>
      )}
      {hasError && (
        <>
          <AlertCircle className="text-destructive mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div className="flex flex-col gap-1">
            {field.state.meta.errors.map((error, index) => (
              <p key={index} className="text-destructive text-xs">
                {typeof error === "string" ? error : error.message}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
