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
  };
};
