import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin as adminPlugin } from "better-auth/plugins";
import { prisma } from "./prisma";
import {
  ac,
  admin as adminRole,
  user,
  staff,
} from "./permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },

  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin: adminRole,
        user,
        staff,
      },
      defaultRole: "user",
    }),
  ],
});