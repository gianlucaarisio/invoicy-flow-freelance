
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Save, ArrowLeft, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface DocumentFormData {
  type: 'Quote' | 'Invoice';
  number: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  vatPercentage: number;
}

const CreateDocument = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const mockClients = [
    { id: '1', name: 'Acme Corporation' },
    { id: '2', name: 'Tech Solutions Inc' },
    { id: '3', name: 'Design Studio LLC' },
    { id: '4', name: 'StartUp Inc' }
  ];

  const mockItems = [
    { id: '1', name: 'Web Development - Frontend', unitPrice: 85, unitOfMeasure: 'hour' },
    { id: '2', name: 'UI/UX Design', unitPrice: 75, unitOfMeasure: 'hour' },
    { id: '3', name: 'Project Management', unitPrice: 65, unitOfMeasure: 'hour' },
    { id: '4', name: 'SEO Optimization', unitPrice: 500, unitOfMeasure: 'project' }
  ];

  const [formData, setFormData] = useState<DocumentFormData>({
    type: 'Quote',
    number: '',
    clientId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    vatPercentage: 22
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Generate document number
  const generateDocumentNumber = (type: 'Quote' | 'Invoice') => {
    const prefix = type === 'Quote' ? 'QUO' : 'INV';
    const year = new Date().getFullYear();
    const number = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}-${number}`;
  };

  // Update document number when type changes
  const handleTypeChange = (type: 'Quote' | 'Invoice') => {
    setFormData({
      ...formData,
      type,
      number: generateDocumentNumber(type)
    });
  };

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      itemId: '',
      itemName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If selecting an item from catalog, populate details
        if (field === 'itemId' && value) {
          const selectedItem = mockItems.find(mockItem => mockItem.id === value);
          if (selectedItem) {
            updatedItem.itemName = selectedItem.name;
            updatedItem.unitPrice = selectedItem.unitPrice;
          }
        }
        
        // Recalculate line total
        updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice;
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const vatAmount = (subtotal * formData.vatPercentage) / 100;
  const totalAmount = subtotal + vatAmount;

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lineItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one line item.',
        variant: 'destructive'
      });
      return;
    }

    // Here you would save the document to your backend
    console.log('Document data:', {
      ...formData,
      lineItems,
      subtotal,
      vatAmount,
      totalAmount
    });

    toast({
      title: 'Document created',
      description: `${formData.type} ${formData.number} has been successfully created.`,
    });

    navigate('/documents');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Document</h1>
          <p className="text-muted-foreground">Create a new quote or invoice for your client.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Details */}
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>Basic information about the document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'Quote' | 'Invoice') => handleTypeChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quote">Quote</SelectItem>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Document Number</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="Enter document number"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>
              {formData.type === 'Invoice' && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes or terms..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Line Items</CardTitle>
                <CardDescription>Add items and services to this document</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-muted-foreground mb-4">No items added yet</div>
                <Button type="button" variant="outline" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.itemId}
                          onValueChange={(value) => updateLineItem(item.id, 'itemId', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockItems.map((mockItem) => (
                              <SelectItem key={mockItem.id} value={mockItem.id}>
                                {mockItem.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        ${item.lineTotal.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        {lineItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Totals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vatPercentage">VAT Percentage (%)</Label>
                    <Input
                      id="vatPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.vatPercentage}
                      onChange={(e) => setFormData({ ...formData, vatPercentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT ({formData.vatPercentage}%):</span>
                    <span>${vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/documents')}>
            Cancel
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Create {formData.type}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDocument;
