
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Plus,
  Receipt
} from 'lucide-react';

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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const mainItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Clients', url: '/clients', icon: Users },
  { title: 'Items & Services', url: '/items', icon: Package },
  { title: 'Documents', url: '/documents', icon: FileText },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible>
      <SidebarContent className="bg-white border-r">
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">InvoiceGen</span>
            </div>
          )}
          {collapsed && (
            <Receipt className="h-6 w-6 text-primary mx-auto" />
          )}
        </div>

        {/* Create New Document Button */}
        <div className="p-4">
          <Button asChild className="w-full" size={collapsed ? 'icon' : 'default'}>
            <NavLink to="/documents/create">
              <Plus className="h-4 w-4" />
              {!collapsed && <span className="ml-2">New Document</span>}
            </NavLink>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
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
