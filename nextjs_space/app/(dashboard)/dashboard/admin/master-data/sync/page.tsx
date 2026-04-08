'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { SyncMonitor } from '@/components/master-data/admin/sync-monitor'

export default function SyncMonitorPage() {
  const router = useRouter()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Giám sát đồng bộ dữ liệu</h1>
          <p className="text-sm text-muted-foreground">M19 MDM – Quản lý đồng bộ từ nguồn ngoài</p>
        </div>
      </div>
      <SyncMonitor />
    </div>
  )
}
