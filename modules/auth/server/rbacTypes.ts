export interface AccessProfileRecord { id:string; companyId:string; name:string; description:string|null; master:boolean; system:boolean; active:boolean }
export interface AccessPermissionRecord { profileId:string; resource:string; canView:boolean; canCreate:boolean; canEdit:boolean; canApprove:boolean; canDelete:boolean; canExport:boolean }
export interface UserAccessRecord { userId:string; profileId:string; profileName:string; master:boolean }
