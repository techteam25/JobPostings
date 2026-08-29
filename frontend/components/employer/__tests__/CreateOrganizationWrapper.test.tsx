import { render, screen, waitFor, within } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";

import CreateOrganizationWrapper from "../CreateOrganizationWrapper";
import { instance } from "@/lib/axios-instance";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/common", () => ({
  DynamicRichTextEditor: ({
    defaultValue,
    onChange,
    onBlur,
    placeholder,
  }: {
    defaultValue?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label="Mission editor"
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
    />
  ),
}));

async function fillGeneralInfo(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(screen.getByLabelText(/company name/i), "Acme Mission");
  await user.type(
    screen.getByLabelText(/mission editor/i),
    "Serve communities through skilled volunteering.",
  );
}

async function fillLocationInfo(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.type(screen.getByLabelText(/company address/i), "123 Main St");
  await user.type(screen.getByLabelText(/^city/i), "Austin");
  await user.click(document.getElementById("form-select-country")!);
  await user.click(screen.getByRole("option", { name: "Canada" }));
}

async function fillContactInfo(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  const logo = new File(["logo-bytes"], "logo.png", { type: "image/png" });
  await user.upload(screen.getByLabelText(/company logo/i), logo);
  await user.type(screen.getByLabelText(/contact phone/i), "5555551234");
  await user.type(screen.getByLabelText(/company website/i), "acme.org");
}

function createdOrganizationResponse() {
  return {
    success: true,
    data: {
      id: 42,
      name: "Acme Mission",
      streetAddress: "123 Main St",
      city: "Austin",
      state: "",
      country: "Canada",
      zipCode: "",
      phone: "5555551234",
      url: "https://acme.org",
      logoUrl: null,
      mission: "Serve communities through skilled volunteering.",
      subscriptionTier: "free",
      subscriptionStatus: "active",
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      jobPostingLimit: null,
      status: "active",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      members: [],
    },
  };
}

describe("CreateOrganizationWrapper", () => {
  beforeEach(() => {
    vi.spyOn(instance, "post").mockResolvedValue({
      status: 201,
      data: createdOrganizationResponse(),
    });
  });

  afterEach(() => {
    vi.mocked(instance.post).mockRestore();
  });

  it("does not advance when Next is clicked with an invalid current step", async () => {
    const user = userEvent.setup();
    render(<CreateOrganizationWrapper />);

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/company address/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it("includes the last step's contact values on the create request", async () => {
    const user = userEvent.setup();
    render(<CreateOrganizationWrapper />);

    await fillGeneralInfo(user);
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(
      await screen.findByLabelText(/company address/i),
    ).toBeInTheDocument();

    await fillLocationInfo(user);
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByLabelText(/contact phone/i)).toBeInTheDocument();

    await fillContactInfo(user);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(instance.post).toHaveBeenCalled();
    });

    const [, body] = vi.mocked(instance.post).mock.calls[0] as [
      string,
      FormData,
    ];
    expect(body.get("name")).toBe("Acme Mission");
    expect(body.get("streetAddress")).toBe("123 Main St");
    expect(body.get("phone")).toBe("5555551234");
    expect(String(body.get("url"))).toContain("acme.org");
    const logo = body.get("logo");
    expect(logo).toBeInstanceOf(File);
    expect((logo as File).name).toBe("logo.png");
  });

  it("does not create an organization when Submit is invalid", async () => {
    const user = userEvent.setup();
    render(<CreateOrganizationWrapper />);

    await fillGeneralInfo(user);
    await user.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByLabelText(/company address/i);

    await fillLocationInfo(user);
    await user.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByLabelText(/contact phone/i);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(
      await screen.findByText(/phone number is required/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/website url is required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
    expect(instance.post).not.toHaveBeenCalled();
  });

  it("keeps a valid step's values after Back", async () => {
    const user = userEvent.setup();
    render(<CreateOrganizationWrapper />);

    await fillGeneralInfo(user);
    await user.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByLabelText(/company address/i);

    await fillLocationInfo(user);
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(await screen.findByLabelText(/company name/i)).toHaveValue(
      "Acme Mission",
    );

    await user.click(screen.getByRole("button", { name: /next/i }));
    const location = await screen.findByLabelText(/company address/i);
    expect(location).toHaveValue("123 Main St");
    expect(screen.getByLabelText(/^city/i)).toHaveValue("Austin");
    expect(
      within(document.getElementById("form-select-country")!).getByText(
        "Canada",
      ),
    ).toBeInTheDocument();
  });
});
