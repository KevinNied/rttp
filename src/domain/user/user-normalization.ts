import { User } from "@/lib/rttp-data";

export function normalizeUser(user: User): User {
  if (
    user.id === 4 ||
    user.email === "testcoach@gmail.com" ||
    user.email === "coach@test.com"
  ) {
    return {
      ...user,
      email: "coach@test.com",
      role: "coach",
    };
  }

  if (
    user.id === 5 ||
    user.email === "testuser@gmail.com" ||
    user.email === "athlete@test.com"
  ) {
    return {
      ...user,
      email: "athlete@test.com",
      role: "athlete",
    };
  }

  return user;
}
