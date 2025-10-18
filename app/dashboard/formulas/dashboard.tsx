"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  IconBeaker,
  IconChartBar,
  IconPlus,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconTrendingUp,
  IconPackage
} from "@tabler/icons-react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FormulaStats {
  total: number
  draft: number
  trials: number
  preProduction: number
  approved: number
}

interface RecentFormula {
  id: string
  name: string
  productName: string
  status: string
  updatedAt: string
  version: number
}

export default function FormulasDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<FormulaStats>({
    total: 0,
    draft: 0,
    trials: 0,
    preProduction: 0,
    approved: 0
  })
  const [recentFormulas, setRecentFormulas] = useState<RecentFormula[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get all formulas to calculate statistics
      const response = await fetch('/api/formulas?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch formulas')
      const data = await response.json()

      const statsObj: FormulaStats = {
        total: 0,
        draft: 0,
        trials: 0,
        preProduction: 0,
        approved: 0
      }

      data.data.forEach((formula: any) => {
        statsObj.total += 1
        switch (formula.status) {
          case 'Draft':
            statsObj.draft += 1
            break
          case 'Trials':
            statsObj.trials += 1
            break
          case 'Pre-Production':
            statsObj.preProduction += 1
            break
          case 'Approved':
            statsObj.approved += 1
            break
        }
      })

      // Get recent formulas (already sorted by updatedAt in API)
      const recentData = data.data.slice(0, 5).map((formula: any) => ({
        id: formula.id,
        name: formula.name,
        productName: formula.productName,
        status: formula.status,
        updatedAt: formula.updatedAt,
        version: formula.version
      }))

      setStats(statsObj)
      setRecentFormulas(recentData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Draft':
        return <IconClock className="h-4 w-4" />
      case 'Trials':
        return <IconAlertTriangle className="h-4 w-4" />
      case 'Pre-Production':
        return <IconTrendingUp className="h-4 w-4" />
      case 'Approved':
        return <IconCheck className="h-4 w-4" />
      default:
        return <IconClock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      case 'Trials':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
      case 'Pre-Production':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'Approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Formulas Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/formulas/new">
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              New Formula
            </Button>
          </Link>
          <Link href="/dashboard/formulas/manage">
            <Button variant="outline">
              <IconBeaker className="mr-2 h-4 w-4" />
              Manage Formulas
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Formulas</CardTitle>
            <IconBeaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All formula versions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              formulas in draft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Trials</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trials}</div>
            <p className="text-xs text-muted-foreground">
              formulas being tested
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pre-Production</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.preProduction}</div>
            <p className="text-xs text-muted-foreground">
              formulas ready for production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <IconCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              formulas approved for use
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Formulas */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Formulas</CardTitle>
            <CardDescription>
              Recently updated formulas across all statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFormulas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconBeaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No formulas yet. Create your first formula to get started.</p>
                </div>
              ) : (
                recentFormulas.map((formula) => (
                  <div key={formula.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <IconPackage className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formula.name}</p>
                          <p className="text-sm text-muted-foreground">
                            v{formula.version} • {formula.productName}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(formula.status)}>
                        {getStatusIcon(formula.status)}
                        <span className="ml-1">{formula.status}</span>
                      </Badge>
                      <Link href={`/dashboard/formulas/${formula.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/formulas/new">
              <Button className="w-full justify-start" variant="outline">
                <IconPlus className="mr-2 h-4 w-4" />
                Create New Formula
              </Button>
            </Link>
            <Link href="/dashboard/formulas/manage">
              <Button className="w-full justify-start" variant="outline">
                <IconBeaker className="mr-2 h-4 w-4" />
                Manage All Formulas
              </Button>
            </Link>
            <Link href="/dashboard/production">
              <Button className="w-full justify-start" variant="outline">
                <IconTrendingUp className="mr-2 h-4 w-4" />
                Production Batches
              </Button>
            </Link>
            <Link href="/dashboard/cogs">
              <Button className="w-full justify-start" variant="outline">
                <IconChartBar className="mr-2 h-4 w-4" />
                Cost Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}