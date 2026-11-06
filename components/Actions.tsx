"use client";

import { SPONSORSHIP_URL, TICKETS_URL } from "@/lib/links";
import { useSite } from "@/components/SiteProvider";

const targets = {
  tickets: {
    href: TICKETS_URL,
    empty: "The ticket page link will be added soon.",
  },
  sponsorship: {
    href: SPONSORSHIP_URL,
    empty: "The sponsorship page link will be added soon.",
  },
} as const;

export function JoinButton({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { openWaitlist } = useSite();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        openWaitlist();
      }}
    >
      {children}
    </button>
  );
}

export function ExternalButton({
  kind,
  className,
  children,
  onClick,
}: {
  kind: keyof typeof targets;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { notify } = useSite();
  const target = targets[kind];

  if (target.href) {
    return (
      <a href={target.href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        notify(target.empty);
      }}
    >
      {children}
    </button>
  );
}
