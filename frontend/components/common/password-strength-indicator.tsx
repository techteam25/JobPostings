import { cn } from "@/lib/utils";

export const PASSWORD_REQUIREMENTS = [
  { label: "Minimum 8 characters", test: (pw: string) => pw.length >= 8 },
  {
    label: "One uppercase character",
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    label: "One lowercase character",
    test: (pw: string) => /[a-z]/.test(pw),
  },
  {
    label: "One special character",
    test: (pw: string) => /[@$!%*?&]/.test(pw),
  },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
] as const;

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-muted-foreground text-xs font-medium">
        Please add all necessary characters to create a safe password.
      </p>
      <ul className="space-y-0.5">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  met ? "bg-accent" : "bg-destructive",
                )}
              />
              <span
                className={cn(
                  met ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
