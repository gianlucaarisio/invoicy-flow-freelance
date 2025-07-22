import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Plus,
  Receipt,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

const mainItems = [
  { titleKey: "navigation.dashboard", url: "/", icon: LayoutDashboard },
  { titleKey: "navigation.clients", url: "/clients", icon: Users },
  { titleKey: "navigation.items", url: "/items", icon: Package },
  { titleKey: "navigation.documents", url: "/documents", icon: FileText },
];

export function AppSidebar() {
  const { t } = useTranslation("common");
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme } = useTheme();

  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? `bg-primary text-primary-foreground font-medium`
      : `hover:bg-accent hover:text-accent-foreground text-foreground`;

  const sidebarBackground = theme === "light" ? "bg-gray-50" : "bg-card";
  const sidebarBorder = theme === "light" ? "border-gray-200" : "border-r";
  const textColor = theme === "light" ? "text-gray-800" : "text-foreground";
  const mutedTextColor =
    theme === "light" ? "text-gray-600" : "text-muted-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className={`${sidebarBackground} ${sidebarBorder}`}>
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              <span className={`font-semibold text-lg ${textColor}`}>
                InvoiceGen
              </span>
            </div>
          )}
          {isCollapsed && <Receipt className="h-6 w-6 text-primary mx-auto" />}
        </div>

        {/* Create New Document Button */}
        <div className="p-4">
          <Button
            asChild
            className="w-full"
            size={isCollapsed ? "icon" : "default"}
          >
            <NavLink to="/documents/create">
              <Plus className="h-4 w-4 text-white" />
              {!isCollapsed && (
                <span className={`ml-2`}>{t("navigation.newDocument")}</span>
              )}
            </NavLink>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={mutedTextColor}>
            {t("navigation.title")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-4 w-4 text-primary" />
                      {!isCollapsed && (
                        <span className={`ml-2 ${textColor}`}>
                          {t(item.titleKey)}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
