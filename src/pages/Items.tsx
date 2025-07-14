
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
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

type Item = Tables<'items'>;

const unitOptions = ['hour', 'day', 'piece', 'kg', 'liter', 'meter', 'square_meter', 'service'];
const categoryOptions = ['Service', 'Product', 'Consulting', 'Maintenance', 'Development', 'Design'];

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'Service': 'bg-blue-100 text-blue-800',
    'Product': 'bg-green-100 text-green-800',
    'Consulting': 'bg-purple-100 text-purple-800',
    'Maintenance': 'bg-orange-100 text-orange-800',
    'Development': 'bg-red-100 text-red-800',
    'Design': 'bg-pink-100 text-pink-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const Items = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_price: 0,
    unit_of_measure: 'hour'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({ title: "Error", description: "Failed to fetch items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      if (editingItem) {
        await supabase.from('items').update(formData).eq('id', editingItem.id);
      } else {
        await supabase.from('items').insert([{ ...formData, user_id: user.id }]);
      }
      fetchItems();
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', unit_price: 0, unit_of_measure: 'hour' });
      toast({ title: "Success", description: "Item saved successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save item", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('items').delete().eq('id', id);
      fetchItems();
      toast({ title: "Success", description: "Item deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      unit_price: item.unit_price,
      unit_of_measure: item.unit_of_measure || 'hour'
    });
    setIsDialogOpen(true);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


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
              setFormData({ name: '', description: '', unit_price: 0, unit_of_measure: 'hour' });
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
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">Unit</Label>
                  <Select
                    value={formData.unit_of_measure}
                    onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
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
              ${items.length > 0 ? (items.reduce((sum, item) => sum + item.unit_price, 0) / items.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Priced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {items.length > 0 ? items.reduce((max, item) => item.unit_price > max.unit_price ? item : max).name : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unit Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map(item => item.unit_of_measure)).size}
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
                    <Badge variant="secondary">
                      {item.unit_of_measure}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ${item.unit_price.toFixed(2)}
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
                  <span className="font-semibold">{item.unit_price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">/ {item.unit_of_measure}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{item.unit_of_measure}</span>
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
