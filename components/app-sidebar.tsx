"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "@/lib/auth-client"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconPackage,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconCalculator,
  IconFlask,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const staticData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Inventory Management",
      url: "/dashboard/inventory",
      icon: IconPackage,
      items: [
        {
          title: "Raw Materials",
          url: "/dashboard/inventory/materials",
          description: "Manage ingredients and raw materials",
        },
        {
          title: "Packaging",
          url: "/dashboard/inventory/packaging",
          description: "Track containers and packaging supplies",
        },
        {
          title: "Labels",
          url: "/dashboard/inventory/labels",
          description: "Manage product labels and printing",
        },
      ],
    },
    {
      title: "Product Management",
      url: "/dashboard/products",
      icon: IconPackage,
      items: [
        {
          title: "Products",
          url: "/dashboard/products",
          description: "Manage product catalog and pricing",
        },
        {
          title: "Formulation Management",
          url: "#",
          icon: IconFlask,
          items: [
            {
              title: "Formulas Dashboard",
              url: "/dashboard/formulas",
              description: "Formula overview and statistics",
            },
            {
              title: "Manage Formulas",
              url: "/dashboard/formulas/manage",
              description: "Create and manage product formulas",
            },
            {
              title: "Production Batches",
              url: "/dashboard/production",
              description: "Track production batches and material usage",
            },
          ],
        },
      ],
    },
    {
      title: "Cost Analysis",
      url: "#",
      icon: IconCalculator,
      items: [
        {
          title: "COGS Calculator",
          url: "/dashboard/cogs",
          description: "Calculate cost of goods sold",
        },
        {
          title: "Pricing Rules",
          url: "/dashboard/pricing",
          description: "Set pricing strategies and margins",
        },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
      items: [
        {
          title: "Inventory Reports",
          url: "#",
          description: "Inventory analysis and trends (Coming Soon)",
        },
        {
          title: "Production Analytics",
          url: "#",
          description: "Production efficiency metrics (Coming Soon)",
        },
        {
          title: "Cost Reports",
          url: "#",
          description: "Cost analysis and profitability (Coming Soon)",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Documentation",
      url: "#",
      icon: IconListDetails,
    },
  ],
  documents: [
    {
      name: "Data Export",
      url: "#",
      icon: IconDatabase,
      description: "Export data for analysis (Coming Soon)",
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
      description: "Generate business reports (Coming Soon)",
    },
    {
      name: "API Documentation",
      url: "#",
      icon: IconFileDescription,
      description: "API reference and integration guides (Coming Soon)",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  
  const userData = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email,
    avatar: session.user.image || "/codeguide-logo.png",
  } : {
    name: "Guest",
    email: "guest@example.com", 
    avatar: "/codeguide-logo.png",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src="/codeguide-logo.png" alt="PAWS Management" width={32} height={32} className="rounded-lg" />
                <span className="text-base font-semibold font-inter">PAWS Management</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={staticData.navMain} />
        <NavDocuments items={staticData.documents} />
        <NavSecondary items={staticData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
