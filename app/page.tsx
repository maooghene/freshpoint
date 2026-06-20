import { SignInButton } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50">
      <h1 className="text-3xl font-bold tracking-tight mb-4 text-zinc-900">
        Hello
      </h1>
      <SignInButton mode="modal">
        <button className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-colors shadow-xs">
          Sign In
        </button>
      </SignInButton>
    </div>
  );
}


