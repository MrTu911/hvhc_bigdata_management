'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Search, Download, RefreshCw, Network } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LineageGraph from '@/components/governance/LineageGraph';
import LineageDetails from '@/components/governance/LineageDetails';
import { DataLineage } from '@/lib/data-governance';

export default function DataLineagePage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [lineage, setLineage] = useState<DataLineage | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch available datasets
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/data/list');
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Không thể tải danh sách datasets');
    }
  };

  const fetchLineage = async (datasetId: string) => {
    if (!datasetId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/governance/lineage?datasetId=${datasetId}`);
      if (response.ok) {
        const data = await response.json();
        setLineage(data.lineage);
        toast.success('Đã tải lineage thành công');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Không thể tải lineage');
      }
    } catch (error) {
      console.error('Error fetching lineage:', error);
      toast.error('Lỗi khi tải data lineage');
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetChange = (value: string) => {
    setSelectedDataset(value);
    fetchLineage(value);
  };

  const handleRefresh = () => {
    if (selectedDataset) {
      fetchLineage(selectedDataset);
    }
  };

  const handleExport = () => {
    if (!lineage) {
      toast.error('Không có dữ liệu để export');
      return;
    }

    const dataStr = JSON.stringify(lineage, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lineage-${selectedDataset}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Đã export lineage');
  };

  const filteredDatasets = datasets.filter(ds =>
    ds.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Lineage</h1>
          <p className="text-muted-foreground">
            Theo dõi nguồn gốc và quá trình xử lý dữ liệu
          </p>
        </div>
        <Network className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn Dataset</CardTitle>
          <CardDescription>
            Chọn dataset để xem data lineage và tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1fr,auto,auto,auto]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm dataset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Dataset Select */}
            <Select value={selectedDataset} onValueChange={handleDatasetChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Chọn dataset" />
              </SelectTrigger>
              <SelectContent>
                {filteredDatasets.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Không tìm thấy dataset
                  </div>
                ) : (
                  filteredDatasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {dataset.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={!selectedDataset || loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!lineage}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lineage Visualization */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-[600px]">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Đang tải data lineage...</p>
            </div>
          </CardContent>
        </Card>
      ) : lineage ? (
        <div className="grid gap-6 lg:grid-cols-[1fr,350px]">
          {/* Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Lineage Graph</CardTitle>
              <CardDescription>
                {lineage.nodes.length} nodes, {lineage.edges.length} connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineageGraph
                lineage={lineage}
                onNodeClick={setSelectedNode}
                selectedNodeId={selectedNode?.id}
              />
            </CardContent>
          </Card>

          {/* Details Panel */}
          <LineageDetails node={selectedNode} />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-[600px] text-center space-y-4">
            <Network className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Chưa có dữ liệu</h3>
              <p className="text-muted-foreground">
                Chọn dataset để xem data lineage
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
