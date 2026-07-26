import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your App" },
      { name: "description", content: "Your mobile app built on Aurora." },
      { property: "og:title", content: "Your App" },
      { property: "og:description", content: "Your mobile app built on Aurora." },
    ],
  }),
  component: Index,
});

// Replace the home placeholder when you start building. See public/README.md for static assets.
function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="text-sm text-muted-foreground">Your app will live here.</p>
    </div>
  );
}
