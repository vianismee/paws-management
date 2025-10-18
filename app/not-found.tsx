import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  IconHome,
  IconPackage,
  IconTestPipe,
  IconCalculator,
  IconSearch,
  IconArrowLeft,
  IconFileDescription,
  IconBox,
  IconAlertTriangle
} from "@tabler/icons-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
              <IconAlertTriangle className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Oops! The page you're looking for seems to have vanished into the digital void.
              But don't worry, your cosmetics manufacturing empire is just a click away.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <IconHome className="w-5 h-5" />
                  Get Back on Track
                </CardTitle>
                <CardDescription>
                  Return to where the action happens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard">
                  <Button className="w-full justify-start" variant="default">
                    <IconHome className="mr-2 h-4 w-4" />
                    Dashboard Home
                  </Button>
                </Link>
                <Link href="/">
                  <Button className="w-full justify-start" variant="outline">
                    <IconArrowLeft className="mr-2 h-4 w-4" />
                    App Homepage
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <IconSearch className="w-5 h-5" />
                  Looking for Something?
                </CardTitle>
                <CardDescription>
                  Quick access to main features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Link href="/dashboard/products" className="flex items-center gap-2 p-2 rounded hover:bg-purple-100 transition-colors">
                    <IconPackage className="w-4 h-4 text-purple-600" />
                    <span>Products</span>
                  </Link>
                  <Link href="/dashboard/formulas" className="flex items-center gap-2 p-2 rounded hover:bg-purple-100 transition-colors">
                    <IconTestPipe className="w-4 h-4 text-purple-600" />
                    <span>Formulas</span>
                  </Link>
                  <Link href="/dashboard/inventory" className="flex items-center gap-2 p-2 rounded hover:bg-purple-100 transition-colors">
                    <IconBox className="w-4 h-4 text-purple-600" />
                    <span>Inventory</span>
                  </Link>
                  <Link href="/dashboard/cogs" className="flex items-center gap-2 p-2 rounded hover:bg-purple-100 transition-colors">
                    <IconCalculator className="w-4 h-4 text-purple-600" />
                    <span>COGS</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Explore PAWS Management Features
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/dashboard/products">
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <IconPackage className="w-6 h-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg">Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Manage your product catalog with volume tracking and IDR pricing
                    </CardDescription>
                    <Badge variant="secondary" className="mt-2">New Features</Badge>
                  </CardContent>
                </Link>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/dashboard/formulas">
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <IconTestPipe className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">Formulas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Create and manage cosmetic formulations with precise ingredient tracking
                    </CardDescription>
                    <Badge variant="secondary" className="mt-2">Lab Tested</Badge>
                  </CardContent>
                </Link>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/dashboard/inventory">
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                      <IconBox className="w-6 h-6 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Inventory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Track materials, packaging, and labels with real-time stock monitoring
                    </CardDescription>
                    <Badge variant="secondary" className="mt-2">Smart Tracking</Badge>
                  </CardContent>
                </Link>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <Link href="/dashboard/cogs">
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      <IconCalculator className="w-6 h-6 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg">COGS Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Calculate costs of goods sold with comprehensive breakdown analysis
                    </CardDescription>
                    <Badge variant="secondary" className="mt-2">Profit Focus</Badge>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </div>

          {/* Help Section */}
          <Card className="border-gray-200 bg-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileDescription className="w-5 h-5" />
                Need Help?
              </CardTitle>
              <CardDescription>
                Common resources and support options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-medium mb-2">Documentation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Access comprehensive guides and API documentation
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    View Docs
                  </Button>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-medium mb-2">Support Team</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Get help from our support team for technical issues
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-medium mb-2">Report Issue</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Found a bug or have a suggestion? Let us know!
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Report Issue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-2">
              Lost? Confused? We're here to help you navigate your cosmetics manufacturing journey.
            </p>
            <p className="text-sm text-gray-500">
              © 2024 PAWS Management System. Empowering Cosmetic Excellence.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}