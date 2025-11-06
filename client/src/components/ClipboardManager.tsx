import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Pin, 
  Trash2, 
  Search, 
  Clock, 
  Package, 
  FileText, 
  DollarSign, 
  MapPin,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const typeIcons = {
  text: FileText,
  tracking: Package,
  case_number: FileText,
  amount: DollarSign,
  address: MapPin,
};

const typeColors = {
  text: 'bg-gray-500/20 text-gray-400',
  tracking: 'bg-blue-500/20 text-blue-400',
  case_number: 'bg-purple-500/20 text-purple-400',
  amount: 'bg-green-500/20 text-green-400',
  address: 'bg-amber-500/20 text-amber-400',
};

export function ClipboardManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: historyData, refetch } = trpc.clipboard.getHistory.useQuery({});
  const { data: statsData } = trpc.clipboard.getStats.useQuery();
  
  const addItemMutation = trpc.clipboard.addItem.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Item added to clipboard');
    },
  });

  const togglePinMutation = trpc.clipboard.togglePin.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(data.pinned ? 'Item pinned' : 'Item unpinned');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteItemMutation = trpc.clipboard.deleteItem.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Item deleted');
    },
  });

  const clearHistoryMutation = trpc.clipboard.clearHistory.useMutation({
    onSuccess: (data) => {
      refetch();
      toast.success(`Cleared ${data.deletedCount} items`);
    },
  });

  const items = historyData?.items || [];
  const stats = statsData?.stats;

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.label?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'pinned' && item.pinned) ||
      item.type === activeTab;

    return matchesSearch && matchesTab;
  });

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="bg-[#0a0e1a] border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-white">Clipboard Manager</CardTitle>
            <CardDescription className="text-gray-400">
              Quick access to frequently used data
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                {stats.total} items
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Unpinned
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search clipboard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0f1419] border-gray-700 text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-500 hover:text-gray-300" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#0f1419] border-gray-700">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pinned">
              Pinned {stats?.pinned ? `(${stats.pinned})` : ''}
            </TabsTrigger>
            <TabsTrigger value="tracking">
              Tracking {stats?.byType.tracking ? `(${stats.byType.tracking})` : ''}
            </TabsTrigger>
            <TabsTrigger value="case_number">
              Cases {stats?.byType.case_number ? `(${stats.byType.case_number})` : ''}
            </TabsTrigger>
            <TabsTrigger value="amount">
              Amounts {stats?.byType.amount ? `(${stats.byType.amount})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No matching items found' : 'No items in clipboard'}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const Icon = typeIcons[item.type];
                  const colorClass = typeColors[item.type];

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-[#0f1419] border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={colorClass}>
                              <Icon className="h-3 w-3 mr-1" />
                              {item.type.replace('_', ' ')}
                            </Badge>
                            {item.label && (
                              <span className="text-xs text-gray-400">{item.label}</span>
                            )}
                            {item.pinned && (
                              <Pin className="h-3 w-3 text-blue-400 fill-current" />
                            )}
                          </div>
                          <div className="font-mono text-sm text-white break-all">
                            {item.content}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(item.content)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePinMutation.mutate({ itemId: item.id })}
                            className="h-8 w-8 p-0"
                          >
                            <Pin className={`h-4 w-4 ${item.pinned ? 'fill-current text-blue-400' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemMutation.mutate({ itemId: item.id })}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
