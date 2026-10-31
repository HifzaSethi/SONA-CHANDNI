import { auth } from "./auth";

export async function requireRoles(
  request: Request,
  allowedRoles: readonly string[]
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return {
      authorized: false as const,
      status: 401 as const,
    };
  }

  const roles = (session.user.role ?? "user")
    .split(",")
    .map((role) => role.trim());

  const hasPermission = roles.some((role) =>
    allowedRoles.includes(role)
  );

  if (!hasPermission) {
    return {
      authorized: false as const,
      status: 403 as const,
    };
  }

  return {
    authorized: true as const,
    session,
  };
}