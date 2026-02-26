import { TypesenseQueryBuilder } from "@/utils/typesense-queryBuilder";

describe("TypesenseQueryBuilder", () => {
  let builder: TypesenseQueryBuilder;

  beforeEach(() => {
    builder = new TypesenseQueryBuilder();
  });

  describe("Location Filters", () => {
    it("should build query with single location filter", () => {
      const query = builder.addLocationFilters({ city: "New York" }).build();

      expect(query).toBe("city:New York");
    });

    it("should build query with multiple location filters", () => {
      const query = builder
        .addLocationFilters({ city: "New York", state: "NY", country: "USA" })
        .build();

      expect(query).toBe("city:New York && state:NY && country:USA");
    });

    it("should handle includeRemote with no location", () => {
      const query = builder.addLocationFilters({}, true).build();

      expect(query).toBe("isRemote:true");
    });

    it("should build OR query with location and includeRemote", () => {
      const query = builder
        .addLocationFilters({ city: "Austin", state: "TX" }, true)
        .build();

      expect(query).toBe("(city:Austin && state:TX) || isRemote:true");
    });

    it("should ignore empty location values", () => {
      const query = builder
        .addLocationFilters({ city: "Boston", state: "", country: undefined })
        .build();

      expect(query).toBe("city:Boston");
    });

    it("should return empty string when no location and no remote", () => {
      const query = builder.addLocationFilters({}).build();

      expect(query).toBe("");
    });
  });

  describe("Skills Filters", () => {
    it("should build AND query for multiple skills", () => {
      const query = builder
        .addSkillFilters(["react", "typescript"], true)
        .build();

      expect(query).toBe("skills:react && skills:typescript");
    });

    it("should build OR query for multiple skills", () => {
      const query = builder
        .addSkillFilters(["react", "vue", "angular"], false)
        .build();

      expect(query).toBe("skills:[react, vue, angular]");
    });

    it("should handle single skill", () => {
      const query = builder.addSkillFilters(["javascript"]).build();

      expect(query).toBe("skills:javascript");
    });

    it("should handle empty skills array", () => {
      const query = builder.addSkillFilters([]).build();

      expect(query).toBe("");
    });

    it("should handle undefined skills", () => {
      const query = builder.addSkillFilters(undefined).build();

      expect(query).toBe("");
    });
  });

  describe("Array Filters", () => {
    it("should build OR query for job types", () => {
      const query = builder
        .addArrayFilter("jobType", ["full-time", "contract"], true)
        .build();

      expect(query).toBe("jobType:[full-time, contract]");
    });

    it("should handle empty array", () => {
      const query = builder.addArrayFilter("jobType", []).build();

      expect(query).toBe("");
    });

    it("should handle undefined array", () => {
      const query = builder.addArrayFilter("jobType", undefined).build();

      expect(query).toBe("");
    });
  });

  describe("Single Value Filters", () => {
    it("should add string filter", () => {
      const query = builder.addSingleFilter("status", "active").build();

      expect(query).toBe("status:active");
    });

    it("should add number filter", () => {
      const query = builder.addSingleFilter("experience", 5).build();

      expect(query).toBe("experience:5");
    });

    it("should add boolean filter", () => {
      const query = builder.addSingleFilter("is_active", true).build();

      expect(query).toBe("is_active:true");
    });

    it("should handle empty string", () => {
      const query = builder.addSingleFilter("status", "").build();

      expect(query).toBe("");
    });

    it("should handle undefined value", () => {
      const query = builder.addSingleFilter("status", undefined).build();

      expect(query).toBe("");
    });

    it("should handle null value", () => {
      const query = builder.addSingleFilter("status", null as any).build();

      expect(query).toBe("");
    });
  });

  describe("Complex Filter Combinations", () => {
    it("should combine location, skills, and job type", () => {
      const query = builder
        .addLocationFilters({ city: "San Francisco", state: "CA" })
        .addSkillFilters(["react", "node"], true)
        .addArrayFilter("jobType", ["full-time", "contract"])
        .build();

      expect(query).toBe(
        "city:San Francisco && state:CA && skills:react && skills:node && jobType:[full-time, contract]",
      );
    });

    it("should combine remote with skills and experience", () => {
      const query = builder
        .addLocationFilters({}, true)
        .addSkillFilters(["python", "django"])
        .addSingleFilter("experience", "5+ years")
        .build();

      expect(query).toBe(
        "isRemote:true && skills:python && skills:django && experience:5+ years",
      );
    });

    it("should build full job search query", () => {
      const query = builder
        .addLocationFilters({ city: "Austin", state: "TX" }, true)
        .addSkillFilters(["typescript", "react", "graphql"], true)
        .addArrayFilter("jobType", ["full-time"])
        .addSingleFilter("status", "active")
        .addSingleFilter("experience", "mid-level")
        .build();

      expect(query).toBe(
        "(city:Austin && state:TX) || isRemote:true && skills:typescript && skills:react && skills:graphql && jobType:[full-time] && status:active && experience:mid-level",
      );
    });

    it("should handle all filters empty", () => {
      const query = builder
        .addLocationFilters({})
        .addSkillFilters([])
        .addArrayFilter("jobType", [])
        .addSingleFilter("status", undefined)
        .build();

      expect(query).toBe("");
    });

    it("should handle partial filters", () => {
      const query = builder
        .addLocationFilters({ city: "Seattle" })
        .addSkillFilters([]) // empty
        .addArrayFilter("jobType", ["part-time"])
        .addSingleFilter("status", undefined) // undefined
        .build();

      expect(query).toBe("city:Seattle && jobType:[part-time]");
    });
  });

  describe("Builder Methods", () => {
    it("should be chainable", () => {
      const result = builder
        .addLocationFilters({ city: "Boston" })
        .addSkillFilters(["java"])
        .addSingleFilter("status", "active");

      expect(result).toBe(builder);
    });

    it("should reset builder state", () => {
      builder
        .addLocationFilters({ city: "Boston" })
        .addSkillFilters(["java"])
        .reset();

      const query = builder.build();
      expect(query).toBe("");
    });

    it("should allow reuse after reset", () => {
      builder.addLocationFilters({ city: "Boston" }).build();

      builder.reset();

      const query = builder.addLocationFilters({ city: "Austin" }).build();

      expect(query).toBe("city:Austin");
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in values", () => {
      const query = builder
        .addSingleFilter("title", "Senior Developer (Remote)")
        .build();

      expect(query).toBe("title:Senior Developer (Remote)");
    });

    it("should handle skills with special characters", () => {
      const query = builder.addSkillFilters(["C++", "C#", ".NET"]).build();

      expect(query).toBe("skills:C++ && skills:C# && skills:.NET");
    });

    it("should handle zipcode as string", () => {
      const query = builder.addSingleFilter("zipcode", "78701").build();

      expect(query).toBe("zipcode:78701");
    });

    it("should handle boolean false value", () => {
      const query = builder.addSingleFilter("is_active", false).build();

      expect(query).toBe("is_active:false");
    });

    it("should handle zero as valid value", () => {
      const query = builder.addSingleFilter("min_salary", 0).build();

      expect(query).toBe("min_salary:0");
    });
  });
});
