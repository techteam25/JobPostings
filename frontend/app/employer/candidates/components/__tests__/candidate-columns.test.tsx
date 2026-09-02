import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { createCandidateColumns } from "../candidate-columns";
import type { CandidatePreview } from "@/types/candidate";

const candidate: CandidatePreview = {
  userId: 42,
  name: "Jane Doe",
  photoUrl: null,
  headline: "Software Engineer",
  skills: ["TypeScript"],
  location: "Austin, TX, USA",
  yearsOfExperience: 6,
  openToWork: true,
};

describe("createCandidateColumns", () => {
  it("opens a candidate profile when a search result is selected", async () => {
    const user = userEvent.setup();
    const onViewProfile = vi.fn();
    const columns = createCandidateColumns({ onViewProfile });
    const actionsColumn = columns.find((column) => column.id === "actions");

    expect(actionsColumn).toBeDefined();

    render(
      <>
        {typeof actionsColumn?.cell === "function"
          ? actionsColumn.cell({
              row: { original: candidate },
            } as never)
          : null}
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: "View Jane Doe's profile" }),
    );

    expect(onViewProfile).toHaveBeenCalledWith(candidate);
  });
});
