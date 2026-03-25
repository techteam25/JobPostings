import { render, screen } from "@/test/test-utils";
import { ProfileBreadcrumb } from "../ProfileBreadcrumb";

describe("ProfileBreadcrumb", () => {
  it("renders 'Back to Profile' link pointing to /me/profile", () => {
    render(<ProfileBreadcrumb currentPage="Qualifications" />);

    const link = screen.getByRole("link", { name: /back to profile/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/me/profile");
  });

  it("renders the current page label", () => {
    render(<ProfileBreadcrumb currentPage="Qualifications" />);

    expect(screen.getByText("Qualifications")).toBeInTheDocument();
  });

  it("renders a separator between the link and current page", () => {
    render(<ProfileBreadcrumb currentPage="Qualifications" />);

    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("renders different page labels correctly", () => {
    render(<ProfileBreadcrumb currentPage="Job Preferences" />);

    expect(screen.getByText("Job Preferences")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to profile/i }),
    ).toBeInTheDocument();
  });

  it("has correct navigation landmark", () => {
    render(<ProfileBreadcrumb currentPage="Qualifications" />);

    expect(
      screen.getByRole("navigation", { name: /breadcrumb/i }),
    ).toBeInTheDocument();
  });
});
