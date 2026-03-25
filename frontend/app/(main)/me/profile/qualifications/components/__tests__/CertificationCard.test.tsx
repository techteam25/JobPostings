import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
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

  it("renders remove button when onRemove is provided", () => {
    render(
      <CertificationCard
        certification={mockCertification}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /remove aws solutions architect/i }),
    ).toBeInTheDocument();
  });

  it("does not render remove button when onRemove is not provided", () => {
    render(<CertificationCard certification={mockCertification} />);

    expect(
      screen.queryByRole("button", { name: /remove/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onRemove with certification when remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <CertificationCard
        certification={mockCertification}
        onRemove={onRemove}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /remove aws solutions architect/i }),
    );

    expect(onRemove).toHaveBeenCalledWith(mockCertification);
  });
});
