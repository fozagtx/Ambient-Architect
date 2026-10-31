import { TasteChat } from "@/components/taste-chat";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-foreground/10 bg-foreground/5">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 text-sm font-medium text-foreground/70 sm:px-6">
          <span>Ambience Architect</span>
          <span className="text-foreground/50">Your taste, translated into space.</span>
        </div>
      </header>
      <TasteChat />
    </div>
  );
}
