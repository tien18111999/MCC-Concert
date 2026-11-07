/** In-app pages. Swap these for an external URL if another team hosts them later. */
export const TICKETS_URL = "/tickets";
export const SPONSORSHIP_URL = "/sponsorships";

export const VOLUNTEER_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfwa2D9lXsJAHs2PuerdCO0hqItbZeB2Db46tSIRT3zBNMffg/viewform?usp=dialog";

export const INSTAGRAM_URL = "https://www.instagram.com/mcc.turnitup/";

export type NavItem =
  | { label: string; href: string; kind: "section" }
  | { label: string; kind: "tickets" };

export const navItems: NavItem[] = [
  { label: "Home", href: "/", kind: "section" },
  { label: "Map", href: "/map", kind: "section" },
  { label: "Vendor", href: "/vendors", kind: "section" },
  { label: "Schedule", href: "/schedule", kind: "section" },
  { label: "Lineup", href: "/lineup", kind: "section" },
  { label: "Tickets", kind: "tickets" },
  { label: "Volunteer", href: "/volunteer", kind: "section" },
  { label: "Sponsorships", href: "/sponsorships", kind: "section" },
];
