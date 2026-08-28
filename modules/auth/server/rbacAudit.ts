import { logHrdpAudit } from "@/modules/hrdp/audit/logHrdpAudit";

export async function auditAccessChange(input:{companyId:string;actorUserId:string;event:"ACCESS_PROFILE_ASSIGNED"|"ACCESS_PERMISSIONS_UPDATED";entityId:string;metadata?:Record<string,string>}){
  await logHrdpAudit({
    companyId: input.companyId,
    actorUserId: input.actorUserId,
    action: input.event,
    entityType: "AccessControl",
    entityId: input.entityId,
    metadata: input.metadata,
  });
}
