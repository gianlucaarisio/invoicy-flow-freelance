
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package, Edit, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Item {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  unitOfMeasure: string;
  category: string;
  timesUsed: number;
}

const Items = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { toast } = useToast();

  // Mock data - replace with real data management
  const [items, setItems] = useState<Item[]>([
    {
      id: '1',
      name: 'Web Development - Frontend',
      description: 'Frontend development services including React, TypeScript, and responsive design',
      unitPrice: 85,
      unitOfMeasure: 'hour',
      category: 'Development',
      timesUsed: 24
    },
    {
      id: '2',
      name: 'UI/UX Design',
      description: 'User interface and user experience design services',
      unitPrice: 75,
      unitOfMeasure: 'hour',
      category: 'Design',
      timesUsed: 18
    },
    {
      id: '3',
      name: 'Project Management',
      description: 'Project coordination and management services',
      unitPrice: 65,
      unitOfMeasure: 'hour',
      category: 'Management',
      timesUsed: 12
    },
    {
      id: '4',
      name: 'SEO Optimization',
      description: 'Search engine optimization and content strategy',
      unitPrice: 500,
      unitOfMeasure: 'project',
      category: 'Marketing',
      timesUsed: 8
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitPrice: 0,
    unitOfMeasure: '',
    category: ''
  });

  const unitOptions = ['hour', 'day', 'project', 'piece', 'page', 'month'];
  const categoryOptions = ['Development', 'Design', 'Management', 'Marketing', 'Consulting', 'Other'];

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      // Update existing item
      setItems(items.map(item => 
        item.id === editingItem.id 
          ? { ...item, ...formData }
          : item
      ));
      toast({
        title: 'Item updated',
        description: 'Item has been successfully updated.',
      });
    } else {
      // Add new item
      const newItem: Item = {
        id: Date.now().toString(),
        ...formData,
        timesUsed: 0
      };
      setItems([...items, newItem]);
      toast({
        title: 'Item added',
        description: 'New item/service has been successfully added.',
      });
    }

    // Reset form
    setFormData({ name: '', description: '', unitPrice: 0, unitOfMeasure: '', category: '' });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      unitPrice: item.unitPrice,
      unitOfMeasure: item.unitOfMeasure,
      category: item.category
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    toast({
      title: 'Item deleted',
      description: 'Item has been successfully deleted.',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Development': 'bg-blue-100 text-blue-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Management': 'bg-green-100 text-green-800',
      'Marketing': 'bg-orange-100 text-orange-800',
      'Consulting': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Other'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items & Services</h1>
          <p className="text-muted-foreground">Manage your products and services catalog.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingItem(null);
              setFormData({ name: '', description: '', unitPrice: 0, unitOfMeasure: '', category: '' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item/Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item/Service' : 'Add New Item/Service'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update item information.' : 'Add a new item or service to your catalog.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item/service name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit</Label>
                  <Select
                    value={formData.unitOfMeasure}
                    onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items and services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${items.length > 0 ? (items.reduce((sum, item) => sum + item.unitPrice, 0) / items.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {items.length > 0 ? items.reduce((max, item) => item.timesUsed > max.timesUsed ? item : max).name : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map(item => item.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{item.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getCategoryColor(item.category)} variant="secondary">
                      {item.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.timesUsed} uses
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {item.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{item.unitPrice.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">/ {item.unitOfMeasure}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item.unitOfMeasure}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchTerm ? 'No items found matching your search.' : 'No items or services added yet.'}
          </div>
          {!searchTerm && (
            <Button 
              className="mt-4" 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Items;
