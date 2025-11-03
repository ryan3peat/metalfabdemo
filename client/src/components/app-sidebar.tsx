import { Home, Users, FileText, Settings, LogOut, User, BarChart3 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "User Management",
    url: "/users",
    icon: User,
  },
];

const supplierMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'procurement';
  const menuItems = isAdmin ? adminMenuItems : supplierMenuItems;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'procurement':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'supplier':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return '';
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.companyName) {
      return user.companyName.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">EF</span>
            </div>
            <div>
              <h2 className="font-medium text-foreground">Essential Flavours</h2>
              <p className="text-xs text-muted-foreground">Supplier Portal</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild data-active={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.companyName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {user?.role && (
            <Badge 
              variant="outline" 
              className={`${getRoleBadgeColor(user.role)} uppercase text-xs font-semibold w-full justify-center`}
            >
              {user.role}
            </Badge>
          )}

          <a 
            href="/api/logout"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
