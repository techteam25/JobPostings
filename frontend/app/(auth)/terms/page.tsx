import type { Metadata } from "next";
import { LegalDocument } from "../components/LegalDocument";

export const metadata: Metadata = { title: "Terms and Conditions" };

// DRAFT: The product owner must review and approve this text before final publication.
// Add approved contact details, applicable law, account closure, and dispute terms.
const sections = [
  {
    title: "Using the service",
    paragraphs: [
      "getINvolved helps individuals find opportunities and lets people representing hiring organizations create and manage postings. You may use the service only for information and activities you are authorized to provide.",
      "Keep your account details accurate and your sign-in credentials secure. An organization account belongs to the individual who signs up; that person may then create an organization and invite other people through the service.",
    ],
  },
  {
    title: "Profiles and postings",
    paragraphs: [
      "You are responsible for the accuracy of profiles, applications, organization details, and job postings you submit. Do not submit information you do not have permission to share or content that misrepresents an opportunity or applicant.",
    ],
  },
  {
    title: "Opportunities",
    paragraphs: [
      "Job information and recommendations help people explore opportunities. A posting, match, or application does not guarantee an interview, offer, or placement. Hiring organizations make their own recruitment decisions.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms and Conditions"
      introduction="These draft terms describe the intended use of getINvolved. The product owner will review and complete them before final publication."
      sections={sections}
      relatedHref="/privacy"
      relatedLabel="Privacy Policy"
    />
  );
}
