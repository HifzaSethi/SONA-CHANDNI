import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  metalRate: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  ...adminAc.statements,
  metalRate: ["read", "update"],
});

export const user = ac.newRole({});

export const staff = ac.newRole({
  metalRate: ["read", "update"],
});