export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-1">
        <span className="font-heading text-lg font-semibold tracking-tight">
          Investor Portal
        </span>
        <span className="text-sm text-muted-foreground">
          Secure access to your investments
        </span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
