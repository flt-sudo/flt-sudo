import { ExternalLink as Icon } from "lucide-react";
import { safeExternalUrl } from "@/lib/discovery/url-extract";

/**
 * Renders a link only for URLs in the app's own canonical shapes. Simulated
 * records are never linked out, since synthetic handles may coincide with real
 * accounts.
 */
export function ExternalLink({ href, simulated, children }: { href: string | null | undefined; simulated?: boolean; children: React.ReactNode }) {
  const safe = safeExternalUrl(href);
  if (!safe || simulated) {
    return <span className="text-muted-foreground" title={simulated ? "Simulated — not linked" : undefined}>{children}</span>;
  }
  return (
    <a
      href={safe}
      target="_blank"
      rel="noopener noreferrer nofollow"
      referrerPolicy="no-referrer"
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      {children}
      <Icon className="size-3" aria-hidden />
    </a>
  );
}
