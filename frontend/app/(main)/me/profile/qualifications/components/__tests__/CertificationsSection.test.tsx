import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { CertificationsSection } from "../CertificationsSection";
import type { Certification } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/me/profile/qualifications",
}));

const mockCertifications: { certification: Certification }[] = [
  { certification: { id: 1, certificationName: "AWS Solutions Architect" } },
  { certification: { id: 2, certificationName: "Google Cloud Professional" } },
];

describe("CertificationsSection", () => {
  it("renders empty state when no certifications", () => {
    render(<CertificationsSection certifications={[]} />);

    expect(screen.getByText(/no certifications added/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add certification/i }),
    ).toBeEnabled();
  });

  it("renders certification badges when entries exist", () => {
    render(<CertificationsSection certifications={mockCertifications} />);

    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
    expect(screen.getByText("Google Cloud Professional")).toBeInTheDocument();
  });

  it("renders Add Certification button when entries exist", () => {
    render(<CertificationsSection certifications={mockCertifications} />);

    expect(
      screen.getByRole("button", { name: /add certification/i }),
    ).toBeInTheDocument();
  });

  it("renders remove buttons on each certification badge", () => {
    render(<CertificationsSection certifications={mockCertifications} />);

    expect(
      screen.getByRole("button", {
        name: /remove aws solutions architect/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /remove google cloud professional/i,
      }),
    ).toBeInTheDocument();
  });

  it("opens remove confirmation dialog when remove is clicked", async () => {
    const user = userEvent.setup();
    render(<CertificationsSection certifications={mockCertifications} />);

    await user.click(
      screen.getByRole("button", {
        name: /remove aws solutions architect/i,
      }),
    );

    expect(
      screen.getByText(/are you sure you want to remove/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^remove$/i }),
    ).toBeInTheDocument();
  });

  it("opens add dialog when Add Certification is clicked from empty state", async () => {
    const user = userEvent.setup();
    render(<CertificationsSection certifications={[]} />);

    await user.click(
      screen.getByRole("button", { name: /add certification/i }),
    );

    expect(
      screen.getByPlaceholderText(/search certifications/i),
    ).toBeInTheDocument();
  });

  it("opens add dialog when Add Certification button is clicked", async () => {
    const user = userEvent.setup();
    render(<CertificationsSection certifications={mockCertifications} />);

    await user.click(
      screen.getByRole("button", { name: /add certification/i }),
    );

    expect(
      screen.getByPlaceholderText(/search certifications/i),
    ).toBeInTheDocument();
  });
});
