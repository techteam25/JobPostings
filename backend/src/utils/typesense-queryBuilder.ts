export class TypesenseQueryBuilder {
  private filterConditions: string[] = [];

  addLocationFilters(
    location: { city?: string; state?: string; country?: string },
    includeRemote?: boolean,
  ) {
    const locationKeys = ["city", "state", "country"] as const;
    const locationFilters = Object.entries(location)
      .filter(([key, value]) => locationKeys.includes(key as any) && value)
      .map(([key, value]) => `${key}:${value}`);

    if (locationFilters.length > 0 && includeRemote) {
      this.filterConditions.push(
        `(${locationFilters.join(" && ")}) || is_remote:true`,
      );
    } else if (locationFilters.length > 0) {
      this.filterConditions.push(...locationFilters);
    } else if (includeRemote) {
      this.filterConditions.push("is_remote:true");
    }

    return this;
  }

  addSkillFilters(skills: string[] | undefined, useAndLogic = true) {
    if (skills && skills.length > 0) {
      if (useAndLogic) {
        skills.forEach((skill) =>
          this.filterConditions.push(`skills:${skill}`),
        );
      } else {
        this.filterConditions.push(`skills:[${skills.join(", ")}]`);
      }
    }
    return this;
  }

  addArrayFilter(
    key: string,
    values:
      | ("full-time" | "part-time" | "contract" | "volunteer" | "internship")[]
      | undefined,
    useOrLogic = true,
  ) {
    if (values && values.length > 0) {
      if (useOrLogic) {
        this.filterConditions.push(`${key}:[${values.join(", ")}]`);
      } else {
        values.forEach((value) =>
          this.filterConditions.push(`${key}:${value}`),
        );
      }
    }
    return this;
  }

  addSingleFilter(key: string, value: string | number | boolean | undefined) {
    if (value !== undefined && value !== null && value !== "") {
      this.filterConditions.push(`${key}:${value}`);
    }
    return this;
  }

  build(): string {
    return this.filterConditions.join(" && ");
  }
}
