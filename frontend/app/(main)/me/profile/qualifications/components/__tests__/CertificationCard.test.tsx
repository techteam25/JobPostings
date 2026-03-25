import { render, screen } from "@/test/test-utils";
import { CertificationCard } from "../CertificationCard";
import type { Certification } from "@/lib/types";

const mockCertification: Certification = {
  id: 1,
  certificationName: "AWS Solutions Architect",
};

describe("CertificationCard", () => {
  it("renders the certification name", () => {
    render(<CertificationCard certification={mockCertification} />);

    expect(screen.getByText("AWS Solutions Architect")).toBeInTheDocument();
  });

  it("renders different certification names", () => {
    const cert: Certification = {
      id: 2,
      certificationName: "Google Cloud Professional",
    };

    render(<CertificationCard certification={cert} />);

    expect(screen.getByText("Google Cloud Professional")).toBeInTheDocument();
  });
});
