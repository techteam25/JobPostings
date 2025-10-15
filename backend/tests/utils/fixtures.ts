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
    education: userEducationsFixture(),
    workExperiences: workExperiencesFixture(),
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
