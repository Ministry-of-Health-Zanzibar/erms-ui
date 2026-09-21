import { Component, inject, ViewChild } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Location } from '@angular/common';
import { EmrNavigationModule, HDividerComponent } from '@elementar/components';
import { MatRipple } from '@angular/material/core';
import { OrderByPipe } from '@elementar/components';
import { ToolbarComponent } from '@layout/sidebar/_toolbar/toolbar.component';
import { PermissionService } from '@core/authentication/permission.service';

export interface NavItem {
  type: string;
  name: string;
  icon?: string;
  id?: string | number;
  link?: string;
  children?: NavItem[];
  permission: string | string[]; // Add this line to include the permission property
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatIcon,
    RouterLink,
    EmrNavigationModule,
    MatRipple,
    ToolbarComponent,
    OrderByPipe,
    HDividerComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    class: 'sidebar',
  },
})
export class SidebarComponent {
  router = inject(Router);
  location = inject(Location);
  height: string | null = '200px';

  @ViewChild('navigation', { static: true })
  navigation!: any;

  navItems: NavItem[] = [


    {
      id: 'dashboard1',
      type: 'Single', // Changed from 'group' to 'link'
      name: 'Dashboard',
      icon: 'dashboard',
      permission: 'View Referral Dashboard',
      link: '/pages/dashboard',
    },

    // {
    //   id: 'dashboard',
    //   type: 'group',
    //   name: 'Dashboard',
    //   icon: 'dashboard',
    //   permission: 'View Dashboard',
    //   children: [
    //     {
    //       type: 'link',
    //       name: 'Dashboard',
    //       link: '/pages/dashboard',
    //       permission: 'View Dashboard',

    //     }
    //   ]
    // },

    {
      id: 'users',
      type: 'group',
      name: 'Config Users & Audit',
      icon: 'manage_accounts',
      permission: ['View User', 'View Permission', 'View Role'],
      children: [
        {
          type: 'link',
          name: 'Manage Users',
          link: '/pages/users',
          permission: 'View User',
        },
        {
          type: 'link',
          name: 'Manage Roles',
          link: '/pages/users/role-permission',
          permission: 'View Role',
        },
        {
          type: 'link',
          name: 'Permission',
          link: '/pages/users/permission',
          permission: 'View Permission',
        },
      ],
    },
    {
      id: 'configid',
      type: 'group',
      icon: 'settings',
      name: 'System Configuration',
      permission: 'Setup Management',
      children: [

        {
          type: 'link',
          name: 'Location',
          link: '/pages/config/location',
          permission: 'View Location',
        },


        {
          type: 'link',
          name: 'Hospital',
          link: '/pages/config/hospital',
          permission: 'View Hospital',
        },

        {
          type: 'link',
          name: 'Referral Type',
          link: '/pages/config/referal-type',
          permission: 'View ReferralType',
        },

        {
          type: 'link',
          name: 'Reason',
          link: '/pages/config/reasons',
          permission: 'View Reason',
        },
        {
          type: 'link',
          name: 'Diagnosis',
          link: '/pages/config/diagnosis',
          permission: 'View Diagnoses',
        },
      ],
    },

     {
      id: 'bodies',
      type: 'Single',
      icon: 'medical_services',
      name: 'Medical Board',
      link: '/pages/patient/bodylist',
      permission: 'View Patient List',
    },
    {
      id: 'patients',
      type: 'Single',
      icon: 'people',
      name: 'Patients',
      link: '/pages/patient/partient',
      permission: 'View Patient',
    },
    {
      id: 'history',
      type: 'Single',
      icon: 'history',
      name: 'View Patient History',
      link: '/pages/patient/patientfromhospital',
      permission: 'View Patient History',
    },


     {
      id: 'referral',
      type: 'Single',
      name: 'Referrals',
      icon: 'call_split',
      link: '/pages/config/referrals',
      permission: 'View Referral',
    },
    {
      id: 'referral',
      type: 'Single',
      name: 'Follow-up',
      icon: 'update',
      link: '/pages/config/referrals/searchfollow-up',
      permission: 'View Referral',
    },
    {
      id: 'bills',
      type: 'Single',
      name: 'Month Bill',
      icon: 'receipt_long',
      link: '/pages/config/referrals/bill-file-list',
      permission: 'View Bill',
    },
    {
      id: 'payment',
      type: 'Single',
      name: 'Payment',
      icon: 'payment',
      link: '/pages/config/referrals/bill-by-hospital',
      permission: 'View Payment',
    },
    // {
    //   id: 'months1',
    //   type: 'Single',
    //   name: 'Month Bill',
    //   icon: 'month',
    //   link: '/pages/config/referrals/monthbill00998778',
    //   permission: 'View Monthly Bill',
    // },
    {
      id: 'top-diagnoses',
      type: 'Single',
      name: 'Top Diagnoses',
      icon: 'analytics',
      permission: 'View Report',
      link: '/pages/patient/top-diagnoses',
    },
    {
      id: 'report3',
      type: 'Single', // Changed from 'group' to 'link'
      name: 'Range Report',
      icon: 'assessment',
      permission: 'View Report',
      link: '/pages/patient/referralreport0990',
    },
    {
      id: 'report4',
      type: 'Single', // Changed from 'group' to 'link'
      name: 'Search Report',
      icon: 'search',
      permission: 'View Report',
      link: '/pages/patient/searchreport99990000',
    },


  ];
  navItemLinks: NavItem[] = [];
  activeLinkId: any = '/';

  constructor(public permission: PermissionService) {}

  ngOnInit() {
    this.navItems.forEach((navItem) => {
      this.navItemLinks.push(navItem);

      if (navItem.children) {
        this.navItemLinks = this.navItemLinks.concat(
          navItem.children as NavItem[]
        );
        this.updateMenu();
      }
    });
    this._activateLink();
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this._activateLink();
        this.updateMenu();
      });
  }

  private _activateLink() {
    const activeLink = this.navItemLinks.find(
      (navItem) => navItem.link === this.location.path()
    );

    if (activeLink) {
      this.activeLinkId = activeLink.link;
    } else {
      this.activeLinkId = null;
    }
  }

  //====================================== code zangu mwanzo hapa ============================

  // Function to check if the user has permission for a specific action
  hasPermission(action: string | string[]): boolean {
    if (Array.isArray(action)) {
      // If it's an array, check if the user has permission for at least one action
      return action.some((permission) =>
        this.permission.parmissionMatched([permission.trim()])
      );
    } else {
      // If it's a string, check if the user has permission for that action
      return this.permission.parmissionMatched([action.trim()]);
    }
  }

  // Function to filter out menu items based on permissions
  filterMenuByPermissions(menu: Array<NavItem>): Array<NavItem> {
    return menu
      .map((group) => {
        // Check if the group itself has a permission and if it's valid
        if (group.permission && !this.hasPermission(group.permission)) {
          // If the group's permission is not met, exclude it entirely
          return null;
        }

        return {
          ...group,
          children: group.children
            ? this.filterChildrenByPermissions(group.children)
            : [],
        };
      })
      .filter((group) => group !== null && group.id !== null) as NavItem[];
  }

  // Recursive function to filter children based on permissions
  filterChildrenByPermissions(children: Array<NavItem>): Array<NavItem> {
    return children
      .map((item) => ({
        ...item,
        children: item.children
          ? this.filterChildrenByPermissions(item.children)
          : [],
      }))
      .filter((item) => {
        if (!item.permission) {
          // If the menu item does not have a permission specified, include it in the filtered menu
          return true;
        }
        return this.hasPermission(item.permission);
      });
  }

  // // Function to filter out menu items based on permissions
  // filterMenuByPermissions(menu: Array<NavItem>): Array<NavItem> {
  //   return menu.map(group => ({
  //     ...group,
  //     children: group.children ? this.filterChildrenByPermissions(group.children) : []
  //   })).filter(group => group.children.length > 0);
  // }

  // // Recursive function to filter children based on permissions
  // filterChildrenByPermissions(children: Array<NavItem>): Array<NavItem> {
  //   return children
  //     .map(item => ({
  //       ...item,
  //       children: item.children ? this.filterChildrenByPermissions(item.children) : []
  //     }))
  //     .filter(item => {
  //       if (!item.permission) {
  //         // If the menu item does not have a permission specified, include it in the filtered menu
  //         return true;
  //       }
  //       return this.hasPermission(item.permission);
  //     });
  // }

  // Function to update the menu based on user permissions
  updateMenu(): void {
    this.navItems = this.filterMenuByPermissions(this.navItems);
  }

  // USER ROLES
  public getUserRole(): any {
    return localStorage.getItem('roles');
  }

  public get isStaff(): boolean {
    return this.getUserRole() === 'ROLE STAFF';
  }

  //====================================== code zangu mwisho hapa ============================
}
