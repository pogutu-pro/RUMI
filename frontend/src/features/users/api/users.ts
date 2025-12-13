import { User } from '@/features/users';

export const getUsers = async (filters?: Record<string, unknown>): Promise<User[]> => {
  // Mock data
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `user-${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    role: i % 3 === 0 ? 'student' : i % 3 === 1 ? 'landlord' : 'caretaker',
    status: i % 5 === 0 ? 'suspended' : 'active',
    joinedAt: new Date(),
  }));
};

export const getUserById = async (id: string): Promise<User> => {
  return {
    id,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student',
    status: 'active',
    joinedAt: new Date(),
  };
};

// Alias for consistency with hooks
export const getUser = getUserById;

export const updateUserStatus = async (id: string, status: User['status']): Promise<User> => {
  return {
     id,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student',
    status,
    joinedAt: new Date(),
  };
};

export const deleteUser = async (id: string): Promise<void> => {
  console.log(`Deleted user ${id}`);
};
