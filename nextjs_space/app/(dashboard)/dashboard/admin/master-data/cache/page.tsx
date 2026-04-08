'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CacheDashboard } from '@/components/master-data/admin/cache-dashboard'

export default function CacheDashboardPage() {
  const router = useRouter()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Cache Dashboard</h1>
          <p className="text-sm text-muted-foreground">M19 MDM – Quản lý cache server-side</p>
        </div>
      </div>
      <CacheDashboard />
    </div>
  )
}
