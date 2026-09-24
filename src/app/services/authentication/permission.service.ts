import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  /**
   * These capabilities are protected by SuperAdminAccess on the API. Keep the
   * role fallback here as well so a Super Admin can still see the controls when
   * an older login response has not yet received the newly-added permissions.
   */
  private readonly superAdminPermissions = new Set([
    'View Audit Logs',
    'Undo Patient History Workflow',
    'Block User',
    'Unblock User',
    'View Patient History',
    'View Patient List',
  ]);

  constructor(private authService: AuthService) { }

  response: any;
  public parmissionMatched(allowedPermission: any): boolean{

    const permissions = Array.isArray(allowedPermission)
      ? allowedPermission
      : [allowedPermission];

    if (
      this.isSuperAdmin() &&
      permissions.some((permission) =>
        this.superAdminPermissions.has(String(permission).trim())
      )
    ) {
      return true;
    }

    let isMatch = false;

    const userPermissions: any = this.authService.getPermissions();
    if(userPermissions != null && userPermissions){
        for(var j = 0; j < userPermissions.length; j++){
          // console.log(userPermissions[j]);
          for(var x = 0; x < permissions.length; x++){
            if(userPermissions[j]?.name == permissions[x]){
              isMatch = true;
              //console.log(allowedPermission[x]);
              break;
            }
          }
          if(isMatch) break;
        }
    }
    return isMatch;
  }

  /**
   * Login responses in this application currently store the first role name
   * as a string. This parser also accepts the older JSON array/object formats
   * so the check remains safe across existing sessions and deployments.
   */
  public isSuperAdmin(): boolean {
    const storedRoleValues = [
      localStorage.getItem('roles'),
      localStorage.getItem('all_roles'),
    ].filter((value): value is string => Boolean(value));

    if (!storedRoleValues.length) {
      return false;
    }

    const roleNames: string[] = [];
    storedRoleValues.forEach((storedRoles) => {
      try {
        const parsed = JSON.parse(storedRoles);
        const roles = Array.isArray(parsed) ? parsed : [parsed];

        roles.forEach((role: any) => {
          const name = typeof role === 'string' ? role : role?.name;
          if (name) {
            roleNames.push(String(name));
          }
        });
      } catch {
        roleNames.push(storedRoles);
      }
    });

    const superAdminRoles = new Set([
      'ROLE ADMIN',
      'ROLE NATIONAL',
      'ROLE SUPER ADMIN',
      'ROLE SUPERADMIN',
    ]);

    return roleNames.some((role) =>
      superAdminRoles.has(role.trim().toUpperCase())
    );
  }
}
