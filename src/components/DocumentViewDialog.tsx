import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface DocumentDetails {
  id: string;
  type: string;
  number: string;
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

interface DocumentViewDialogProps {
  documentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocumentViewDialog = ({ documentId, open, onOpenChange }: DocumentViewDialogProps) => {
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (documentId && open) {
      fetchDocumentDetails(documentId);
    }
  }, [documentId, open]);

  const fetchDocumentDetails = async (id: string) => {
    setLoading(true);
    try {
      // Fetch document with client info
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select(`
          *,
          clients(name)
        `)
        .eq('id', id)
        .single();

      if (docError) throw docError;

      // Fetch line items
      const { data: lineItems, error: lineError } = await supabase
        .from('document_line_items')
        .select('*')
        .eq('document_id', id);

      if (lineError) throw lineError;

      setDocument({
        id: docData.id,
        type: docData.type,
        number: docData.number,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Issued': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-emerald-100 text-emerald-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Rejected': return 'bg-gray-100 text-gray-800';
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'Invoice' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-indigo-100 text-indigo-800';
  };

  if (!document && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Document Details</span>
            {document && (
              <>
                <Badge className={getTypeColor(document.type)} variant="secondary">
                  {document.type}
                </Badge>
                <Badge className={getStatusColor(document.status)} variant="secondary">
                  {document.status}
                </Badge>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-lg">Loading document details...</div>
          </div>
        ) : document ? (
          <div className="space-y-6">
            {/* Document Header */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Document Number</label>
                  <p className="text-lg font-semibold">{document.number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p className="text-lg">{document.client_name}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                  <p className="text-lg">{new Date(document.issue_date).toLocaleDateString()}</p>
                </div>
                {document.due_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                    <p className="text-lg">{new Date(document.due_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Line Items</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-right p-3 font-medium">Quantity</th>
                      <th className="text-right p-3 font-medium">Unit Price</th>
                      <th className="text-right p-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.line_items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-right p-3">{item.quantity}</td>
                        <td className="text-right p-3">${item.unit_price.toLocaleString()}</td>
                        <td className="text-right p-3 font-medium">${item.line_total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal:</span>
                <span>${document.subtotal.toLocaleString()}</span>
              </div>
              {document.vat_percentage > 0 && (
                <div className="flex justify-between">
                  <span className="font-medium">VAT ({document.vat_percentage}%):</span>
                  <span>${document.vat_amount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>${document.total_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            {document.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="mt-1 text-sm">{document.notes}</p>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};