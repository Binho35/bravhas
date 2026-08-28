import { prisma } from "@/lib/prisma";
import { getServerAuthUser } from "./session";

export async function assertEmployeeScope(employeeId:string){
  const user=await getServerAuthUser();
  if(!user) throw new Error("Sessão inválida ou expirada.");
  const employee=await prisma.hrEmployee.findFirst({where:{id:employeeId,companyId:user.companyId},select:{id:true,managerId:true}});
  if(!employee) throw new Error("Colaborador fora do escopo autorizado.");
  if(user.role==="OWNER"||user.role==="ADMIN"||user.role==="HR"||user.role==="PAYROLL") return employee;
  // Usuários operacionais nunca podem atravessar a fronteira da empresa. O vínculo por gestor
  // será endurecido quando User e HrEmployee tiverem identidade funcional explicitamente associada.
  return employee;
}
