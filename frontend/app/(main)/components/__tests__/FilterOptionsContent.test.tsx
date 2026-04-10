import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import {
  FilterOptionsContent,
  type FilterOptionsContentProps,
} from "../FilterOptionsContent";

const defaultProps: FilterOptionsContentProps = {
  jobTypes: [],
  remoteOnly: false,
  datePosted: null,
  serviceRoles: [],
  onJobTypesChange: vi.fn(),
  onRemoteOnlyChange: vi.fn(),
  onDatePostedChange: vi.fn(),
  onServiceRolesChange: vi.fn(),
};

function renderContent(overrides: Partial<FilterOptionsContentProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return { ...render(<FilterOptionsContent {...props} />), props };
}

describe("FilterOptionsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Remote Only toggle", () => {
    it("renders unchecked by default", () => {
      renderContent();
      const toggle = screen.getByRole("switch", { name: /remote only/i });
      expect(toggle).not.toBeChecked();
    });

    it("renders checked when remoteOnly is true", () => {
      renderContent({ remoteOnly: true });
      const toggle = screen.getByRole("switch", { name: /remote only/i });
      expect(toggle).toBeChecked();
    });

    it("calls onRemoteOnlyChange when toggled", async () => {
      const onRemoteOnlyChange = vi.fn();
      renderContent({ onRemoteOnlyChange });

      await userEvent.click(
        screen.getByRole("switch", { name: /remote only/i }),
      );
      expect(onRemoteOnlyChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Job Type checkboxes", () => {
    it("renders all 5 job types including Volunteer", async () => {
      renderContent();

      // Open the Job Type accordion
      await userEvent.click(screen.getByText("Job Type"));

      expect(screen.getByLabelText("Full-time")).toBeInTheDocument();
      expect(screen.getByLabelText("Part-time")).toBeInTheDocument();
      expect(screen.getByLabelText("Contract")).toBeInTheDocument();
      expect(screen.getByLabelText("Volunteer")).toBeInTheDocument();
      expect(screen.getByLabelText("Internship")).toBeInTheDocument();
    });

    it("reflects checked state from props", async () => {
      renderContent({ jobTypes: ["full-time", "volunteer"] });

      await userEvent.click(screen.getByText("Job Type"));

      expect(
        screen.getByRole("checkbox", { name: /full-time/i }),
      ).toBeChecked();
      expect(
        screen.getByRole("checkbox", { name: /volunteer/i }),
      ).toBeChecked();
      expect(
        screen.getByRole("checkbox", { name: /contract/i }),
      ).not.toBeChecked();
    });

    it("calls onJobTypesChange with added type when checking", async () => {
      const onJobTypesChange = vi.fn();
      renderContent({ jobTypes: ["full-time"], onJobTypesChange });

      await userEvent.click(screen.getByText("Job Type"));
      await userEvent.click(
        screen.getByRole("checkbox", { name: /contract/i }),
      );

      expect(onJobTypesChange).toHaveBeenCalledWith(["full-time", "contract"]);
    });

    it("calls onJobTypesChange with removed type when unchecking", async () => {
      const onJobTypesChange = vi.fn();
      renderContent({
        jobTypes: ["full-time", "contract"],
        onJobTypesChange,
      });

      await userEvent.click(screen.getByText("Job Type"));
      await userEvent.click(
        screen.getByRole("checkbox", { name: /full-time/i }),
      );

      expect(onJobTypesChange).toHaveBeenCalledWith(["contract"]);
    });
  });

  describe("Date Posted radio group", () => {
    it("calls onDatePostedChange when selecting a date range", async () => {
      const onDatePostedChange = vi.fn();
      renderContent({ onDatePostedChange });

      await userEvent.click(screen.getByText("Date Posted"));
      await userEvent.click(screen.getByLabelText("Last 7 days"));

      expect(onDatePostedChange).toHaveBeenCalledWith("last-7-days");
    });

    it("calls onDatePostedChange with null when selecting Any Time", async () => {
      const onDatePostedChange = vi.fn();
      renderContent({ datePosted: "last-7-days", onDatePostedChange });

      await userEvent.click(screen.getByText("Date Posted"));
      await userEvent.click(screen.getByLabelText("Any Time"));

      expect(onDatePostedChange).toHaveBeenCalledWith(null);
    });
  });

  describe("Service Role checkboxes", () => {
    it("calls onServiceRolesChange when toggling a role", async () => {
      const onServiceRolesChange = vi.fn();
      renderContent({ onServiceRolesChange });

      await userEvent.click(screen.getByText("Service Role"));
      await userEvent.click(screen.getByRole("checkbox", { name: /paid/i }));

      expect(onServiceRolesChange).toHaveBeenCalledWith(["paid"]);
    });
  });
});
