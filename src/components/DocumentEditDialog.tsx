import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentDetails {
  id: string;
  type: string;
  number: string;
  client_id: string;
  client_name: string;
  issue_date: string;
  due_date?: string;
  status: string;
  subtotal: number;
  vat_percentage: number;
  vat_amount: number;
  total_amount: number;
  notes?: string;
  line_items: {
    id: string;
    item_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

interface DocumentEditDialogProps {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdated: () => void;
}

export const DocumentEditDialog = ({ documentId, open, onOpenChange, onDocumentUpdated }: DocumentEditDialogProps) => {
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchClients();
      if (documentId) {
        fetchDocumentDetails(documentId);
      }
    }
  }, [documentId, open]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchDocumentDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select(`
          *,
          clients(name)
        `)
        .eq('id', id)
        .single();

      if (docError) throw docError;

      const { data: lineItems, error: lineError } = await supabase
        .from('document_line_items')
        .select('*')
        .eq('document_id', id);

      if (lineError) throw lineError;

      setDocument({
        id: docData.id,
        type: docData.type,
        number: docData.number,
        client_id: docData.client_id,
        client_name: docData.clients?.name || 'Unknown Client',
        issue_date: docData.issue_date,
        due_date: docData.due_date,
        status: docData.status,
        subtotal: parseFloat(docData.subtotal.toString()),
        vat_percentage: parseFloat(docData.vat_percentage.toString()),
        vat_amount: parseFloat(docData.vat_amount.toString()),
        total_amount: parseFloat(docData.total_amount.toString()),
        notes: docData.notes,
        line_items: lineItems?.map(item => ({
          id: item.id,
          item_name: item.item_name,
          description: item.description,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          line_total: parseFloat(item.line_total.toString())
        })) || []
      });
    } catch (error) {
      console.error('Error fetching document details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (lineItems: typeof document.line_items) => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const vatAmount = subtotal * (document?.vat_percentage || 0) / 100;
    const totalAmount = subtotal + vatAmount;
    
    return { subtotal, vatAmount, totalAmount };
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    if (!document) return;
    
    const updatedItems = [...document.line_items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate line total
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].line_total = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    const { subtotal, vatAmount, totalAmount } = calculateTotals(updatedItems);
    
    setDocument({
      ...document,
      line_items: updatedItems,
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount
    });
  };

  const addLineItem = () => {
    if (!document) return;
    
    const newItem = {
      id: `temp-${Date.now()}`,
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      line_total: 0
    };
    
    setDocument({
      ...document,
      line_items: [...document.line_items, newItem]
    });
  };

  const removeLineItem = (index: number) => {
    if (!document) return;
    
    const updatedItems = document.line_items.filter((_, i) => i !== index);
    const { subtotal, vatAmount, totalAmount } = calculateTotals(updatedItems);
    
    setDocument({
      ...document,
      line_items: updatedItems,
      subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount
    });
  };

  const updateVatPercentage = (vatPercentage: number) => {
    if (!document) return;
    
    const { subtotal, vatAmount, totalAmount } = calculateTotals(document.line_items);
    const newVatAmount = subtotal * vatPercentage / 100;
    const newTotalAmount = subtotal + newVatAmount;
    
    setDocument({
      ...document,
      vat_percentage: vatPercentage,
      vat_amount: newVatAmount,
      total_amount: newTotalAmount
    });
  };

  const handleSave = async () => {
    if (!document) return;
    
    setSaving(true);
    try {
      // Update document
      const { error: docError } = await supabase
        .from('documents')
        .update({
          client_id: document.client_id,
          issue_date: document.issue_date,
          due_date: document.due_date || null,
          status: document.status,
          subtotal: document.subtotal,
          vat_percentage: document.vat_percentage,
          vat_amount: document.vat_amount,
          total_amount: document.total_amount,
          notes: document.notes || null
        })
        .eq('id', document.id);

      if (docError) throw docError;

      // Delete existing line items and insert new ones
      const { error: deleteError } = await supabase
        .from('document_line_items')
        .delete()
        .eq('document_id', document.id);

      if (deleteError) throw deleteError;

      // Insert new line items
      const lineItemsToInsert = document.line_items.map(item => ({
        document_id: document.id,
        item_name: item.item_name,
        description: item.description || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
        user_id: user?.id || ''
      }));

      if (lineItemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('document_line_items')
          .insert(lineItemsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Document updated successfully.'
      });

      onDocumentUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: 'Failed to update document.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!document && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Edit Document</span>
            <Badge variant="secondary">{document?.type}</Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Loading document details...</div>
          </div>
        ) : document ? (
          <div className="space-y-6">
            {/* Document Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select 
                  value={document.client_id} 
                  onValueChange={(value) => setDocument({...document, client_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={document.status} 
                  onValueChange={(value) => setDocument({...document, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Issued">Issued</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  type="date"
                  value={document.issue_date}
                  onChange={(e) => setDocument({...document, issue_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  type="date"
                  value={document.due_date || ''}
                  onChange={(e) => setDocument({...document, due_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_percentage">VAT Percentage</Label>
                <Input
                  type="number"
                  value={document.vat_percentage}
                  onChange={(e) => updateVatPercentage(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Line Items</h3>
                <Button onClick={addLineItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {document.line_items.map((item, index) => (
                  <div key={item.id || index} className="grid grid-cols-12 gap-2 items-end p-3 border rounded">
                    <div className="col-span-3">
                      <Label className="text-xs">Item Name</Label>
                      <Input
                        value={item.item_name}
                        onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                        placeholder="Item name"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Total</Label>
                      <div className="text-sm font-medium p-2 bg-muted rounded">
                        ${item.line_total.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        onClick={() => removeLineItem(index)}
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${document.subtotal.toFixed(2)}</span>
              </div>
              {document.vat_percentage > 0 && (
                <div className="flex justify-between">
                  <span>VAT ({document.vat_percentage}%):</span>
                  <span>${document.vat_amount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${document.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                value={document.notes || ''}
                onChange={(e) => setDocument({...document, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};