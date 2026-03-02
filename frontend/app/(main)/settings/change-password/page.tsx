import ChangePasswordForm from "./components/change-password-form";

export default function ChangePasswordPage() {
  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            Change Password
          </h1>
          <p className="text-secondary-foreground">
            Update your password to keep your account secure
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
