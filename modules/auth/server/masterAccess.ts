import { requireServerRole } from "./session";

export async function requireMasterAccess(){
  return requireServerRole(["OWNER","ADMIN"]);
}
