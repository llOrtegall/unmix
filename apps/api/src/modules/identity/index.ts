// Other modules reference users only through foreign keys, so the table is the identity module's only export.
export { users } from "./infrastructure/identitySchema.ts";
