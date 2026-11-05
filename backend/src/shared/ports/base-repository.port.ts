import { PaginationMeta } from "@shared/types";

export interface BaseRepositoryPort<TSelect, TInsert> {
  create(data: TInsert): Promise<number>;
  findById(id: number): Promise<TSelect>;
  findAll(
    options?: Partial<Pick<PaginationMeta, "limit" | "page">>,
  ): Promise<{ items: TSelect[]; pagination: PaginationMeta }>;
  update(id: number, data: Partial<TInsert>): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
