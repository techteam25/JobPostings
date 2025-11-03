import { Mock, vi } from "vitest";

vi.mock("@/db/connection", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

import { db } from "@/db/connection";
import { UserRepository } from "@/repositories/user.repository";

describe("UserRepository.saveJobForUser - saved jobs limit", () => {
  it("throws DatabaseError when saved jobs >= 50", async () => {
    const txMock = {
      $count: vi.fn().mockResolvedValue(50),
    };

    (db.transaction as Mock).mockImplementation(async (cb: any) => {
      return cb(txMock);
    });

    const repo = new UserRepository();

    await expect(repo.saveJobForUser(1, 123)).rejects.toThrowError(
      /Saved jobs limit reached. You can save up to 50 jobs./,
    );

    expect(txMock.$count).toHaveBeenCalled();
  });
});
