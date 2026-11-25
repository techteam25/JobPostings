import type { Metadata } from "next";
import { LegalDocument } from "../components/LegalDocument";

export const metadata: Metadata = { title: "Privacy Policy" };

// DRAFT: The product owner must review and approve this text before final publication.
// Add approved details for retention, processors, transfers, user requests, and contact.
const sections = [
  {
    title: "Information you provide",
    paragraphs: [
      "When you create an account, you provide a name, email address, and sign-in information. A job seeker may also add profile details, work and education history, preferences, a resume, and application materials. A hiring manager may add organization and job posting details.",
      "If you choose Google or LinkedIn sign-in, that provider may share account information needed to sign you in. Your use of that provider is also subject to its own privacy terms.",
    ],
  },
  {
    title: "How the service uses it",
    paragraphs: [
      "The service uses account information to sign you in and provide the features you choose. Profile and preference details support job recommendations and alerts. Application details are used to send and manage applications. Organization details support postings and team access.",
    ],
  },
  {
    title: "What others can see",
    paragraphs: [
      "A hiring organization can receive information you include in an application. Published job postings are available to people browsing opportunities. Review information before you submit or publish it.",
    ],
  },
  {
    title: "Your choices",
    paragraphs: [
      "You can edit profile information and notification preferences in your account. Additional details about retention, service providers, privacy requests, and contact methods will be added after the product owner's review.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      introduction="This draft explains the information used by the current getINvolved features. The product owner will review and complete it before final publication."
      sections={sections}
      relatedHref="/terms"
      relatedLabel="Terms and Conditions"
    />
  );
}
