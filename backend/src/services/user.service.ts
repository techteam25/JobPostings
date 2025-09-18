import { UserRepository } from '../repositories/user.repository';
import { BaseService } from './base.service';
import { NewUserProfile, UpdateUser } from '../db/schema/users';

export class UserService extends BaseService {
  private userRepository: UserRepository;

  constructor() {
    super();
    this.userRepository = new UserRepository();
  }

  async getAllUsers(options: { page?: number; limit?: number; searchTerm?: string } = {}) {
    try {
      const { searchTerm, ...paginationOptions } = options;

      if (searchTerm) {
        return await this.userRepository.searchUsers(searchTerm, paginationOptions);
      }

      return await this.userRepository.findAll(paginationOptions);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.userRepository.findByIdWithProfile(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove sensitive data
      const { users: userData, user_profile: profileData } = user;
      const { passwordHash, ...safeUserData } = userData;

      return {
        ...safeUserData,
        profile: profileData,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUser(id: number, updateData: UpdateUser) {
    try {
      const success = await this.userRepository.update(id, updateData);
      if (!success) {
        throw new Error('Failed to update user');
      }

      return await this.getUserById(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateUserProfile(userId: number, profileData: Partial<NewUserProfile>) {
    try {
      await this.userRepository.updateProfile(userId, profileData);
      return await this.getUserById(userId);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deactivateUser(id: number) {
    try {
      const success = await this.userRepository.update(id, { isActive: false });
      if (!success) {
        throw new Error('Failed to deactivate user');
      }

      return { message: 'User deactivated successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }

  async activateUser(id: number) {
    try {
      const success = await this.userRepository.update(id, { isActive: true });
      if (!success) {
        throw new Error('Failed to activate user');
      }

      return { message: 'User activated successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }
}