export const userProfileFixture = async () => {
  const { faker } = await import("@faker-js/faker");

  return {
    profilePicture: faker.image.avatar(),
    bio: faker.lorem.paragraph(),
    resumeUrl: faker.internet.url(),
    linkedinUrl: faker.internet.url(),
    portfolioUrl: faker.internet.url(),
    phoneNumber: faker.phone.number({ style: "international" }),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode("#####"),
    country: faker.location.country(),
    education: await userEducationsFixture(),
    workExperiences: await workExperiencesFixture(),
    certifications: userCertificationsFixture(),
  };
};

export const userEducationsFixture = async () => {
  const { faker } = await import("@faker-js/faker");

  return [
    {
      schoolName: faker.company.name(),
      program: "Bachelors" as const,
      major: "Computer Science",
      graduated: true,
      startDate: new Date("2015-08-15T00:00:00Z"),
      endDate: new Date("2019-05-20T00:00:00Z"),
    },
  ];
};

export const workExperiencesFixture = async () => {
  const { faker } = await import("@faker-js/faker");

  return [
    {
      companyName: faker.company.name(),
      current: false,
      startDate: new Date("2020-01-01T00:00:00Z"),
      endDate: new Date("2022-01-01T00:00:00Z"),
    },
  ];
};

export const userCertificationsFixture = () => {
  return [
    {
      certificationName: "Certified Kubernetes Developer",
    },
  ];
};

export const userFixture = async () => {
  const { faker } = await import("@faker-js/faker");
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    image: faker.image.avatar(),
    password: "Password@123",
    // status: "active" as const,
  };
};

export const organizationFixture = async () => {
  const { faker } = await import("@faker-js/faker");

  return {
    name: faker.company.name(),
    streetAddress: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    zipCode: faker.location.zipCode("#####"),
    phone: faker.phone.number({ style: "national" }),
    url: faker.internet.url(),
    mission: faker.lorem.sentence(),
  };
};

enum sampleJobTitles {
  SoftwareEngineer = "Software Engineer",
  FrontendDeveloper = "Frontend Developer",
  BackendDeveloper = "Backend Developer",
  FullStackDeveloper = "Full Stack Developer",
  DevOpsEngineer = "DevOps Engineer",
  DataScientist = "Data Scientist",
  ProductManager = "Product Manager",
  UXDesigner = "UX Designer",
  MobileAppDeveloper = "Mobile App Developer",
  QAEngineer = "QA Engineer",
  SeniorReactDeveloper = "Senior React Developer",
}

export const jobPostingFixture = async () => {
  const { faker } = await import("@faker-js/faker");

  return {
    title: faker.helpers.enumValue(sampleJobTitles),
    description: faker.lorem.paragraph(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    jobType: "full-time",
    compensationType: "paid",
    experience: "mid",
    currency: "USD",
    isRemote: false,
    applicationDeadline: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 30 days from now
    skills: ["JavaScript", "TypeScript", "Node.js"],
    employerId: 1, // Assuming organization with ID 1 exists
  };
};
