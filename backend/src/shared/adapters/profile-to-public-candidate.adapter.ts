import type { ProfileRepositoryPort } from "@/modules/user-profile";
import {
  buildCandidateSearchDocument,
  stripHtmlAndMarkdown,
} from "@/modules/user-profile";
import type {
  PublicCandidateProfile,
  PublicCandidateProfileQueryPort,
} from "@shared/ports/public-candidate-profile-query.port";

/**
 * Adapter bridging the user-profile repository into the organizations module's
 * PublicCandidateProfileQueryPort. Returns only allowlisted public fields.
 */
export class ProfileToPublicCandidateAdapter implements PublicCandidateProfileQueryPort {
  constructor(private readonly profileRepository: ProfileRepositoryPort) {}

  async getPublicProfile(
    userId: number,
  ): Promise<PublicCandidateProfile | null> {
    const user = await this.profileRepository.findByIdWithProfile(userId);

    if (
      !user ||
      user.intent !== "seeker" ||
      user.deletedAt !== null ||
      !user.profile ||
      !user.profile.isProfilePublic
    ) {
      return null;
    }

    const skills =
      user.profile.skills
        ?.map((entry) => entry.skill?.name)
        .filter((name): name is string => Boolean(name)) ?? [];

    const doc = buildCandidateSearchDocument({
      user: {
        id: user.id,
        fullName: user.fullName,
        intent: user.intent,
        deletedAt: user.deletedAt,
      },
      userProfile: user.profile,
      workExperiences: user.profile.workExperiences ?? [],
      skills,
    });

    if (!doc) {
      return null;
    }

    const bio = user.profile.bio?.trim()
      ? stripHtmlAndMarkdown(user.profile.bio)
      : null;

    return {
      userId: doc.userId,
      name: doc.name,
      photoUrl: doc.photoUrl ?? null,
      headline: doc.headline,
      bio: bio || null,
      skills: doc.skills,
      location: doc.location,
      yearsOfExperience: doc.yearsOfExperience,
      openToWork: doc.openToWork,
      workExperiences: (user.profile.workExperiences ?? []).map((we) => ({
        jobTitle: we.jobTitle,
        companyName: we.companyName,
        description: we.description ?? null,
        current: we.current,
        startDate: new Date(we.startDate).toISOString(),
        endDate: we.endDate ? new Date(we.endDate).toISOString() : null,
      })),
      educations: (user.profile.education ?? []).map((ed) => ({
        schoolName: ed.schoolName,
        major: ed.major,
        graduated: ed.graduated,
        startDate: new Date(ed.startDate).toISOString(),
        endDate: ed.endDate ? new Date(ed.endDate).toISOString() : null,
      })),
      certifications: (user.profile.certifications ?? [])
        .map((entry) => entry.certification?.certificationName)
        .filter((name): name is string => Boolean(name)),
    };
  }
}
