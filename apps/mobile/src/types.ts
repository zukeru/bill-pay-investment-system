export type Role = "backer" | "applicant" | "admin";
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  country: string;
  verificationStatus: string;
  emailVerified?: boolean;
  profile: Record<string, string | boolean>;
}
export interface Request {
  id: string;
  ownerId: string;
  kind: "bill" | "project";
  title: string;
  story: string;
  category: string;
  amountCents: number;
  fundedCents: number;
  reservedCents: number;
  currency: string;
  country: string;
  city: string;
  dueDate: string;
  billerName: string;
  projectSummary: string;
  terms: string;
  riskDisclosure: string;
  status: string;
  image: string;
  createdAt: string;
  applicantName: string;
  saved: boolean;
  verificationLabel: string;
  documentCount: number;
  documents?: DocumentRecord[];
}
export interface Transaction {
  id: string;
  requestId: string;
  requestTitle: string;
  kind: "contribution" | "investment_interest";
  amountCents: number;
  currency: string;
  status: string;
  mode: "demo" | "stripe_test";
  createdAt: string;
  reference: string;
}
export interface DocumentRecord {
  id: string;
  name: string;
  mime: string;
  size: number;
}
export type Page =
  | "discover"
  | "saved"
  | "activity"
  | "profile"
  | "help"
  | "dashboard"
  | "submit"
  | "admin";
export const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
export const countryName = (code: string) =>
  ({
    US: "United States",
    CM: "Cameroon",
    GH: "Ghana",
    KE: "Kenya",
    ZA: "South Africa",
    RW: "Rwanda",
    GB: "United Kingdom",
    CA: "Canada",
  })[code] || code;
export const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
