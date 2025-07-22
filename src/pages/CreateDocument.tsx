import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Save, ArrowLeft, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import useTranslation from "@/hooks/useTranslation";

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
  type: "Quote" | "Invoice";
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
  const { user } = useAuth();
  const { t, formatCurrency } = useTranslation("documents");

  // State for clients and items from Supabase
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [items, setItems] = useState<
    Array<{ id: string; name: string; unit_price: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  // Fetch clients and items from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [clientsResponse, itemsResponse] = await Promise.all([
          supabase.from("clients").select("id, name").eq("user_id", user.id),
          supabase
            .from("items")
            .select("id, name, unit_price")
            .eq("user_id", user.id),
        ]);

        if (clientsResponse.error) throw clientsResponse.error;
        if (itemsResponse.error) throw itemsResponse.error;

        setClients(clientsResponse.data || []);
        setItems(itemsResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: t("create.errorTitle"),
          description: t("create.loadingData"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Generate document number
  const generateDocumentNumber = (type: "Quote" | "Invoice") => {
    const prefix = type === "Quote" ? "QUO" : "INV";
    const year = new Date().getFullYear();
    const number = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}-${year}-${number}`;
  };

  const [formData, setFormData] = useState<DocumentFormData>({
    type: "Quote",
    number: generateDocumentNumber("Quote"),
    clientId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    vatPercentage: 22,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Update document number when type changes
  const handleTypeChange = (type: "Quote" | "Invoice") => {
    setFormData({
      ...formData,
      type,
      number: generateDocumentNumber(type),
    });
  };

  // Add new line item
  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      itemId: "",
      itemName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          // If selecting an item from catalog, populate details
          if (field === "itemId" && value) {
            const selectedItem = items.find((item) => item.id === value);
            if (selectedItem) {
              updatedItem.itemName = selectedItem.name;
              updatedItem.unitPrice = selectedItem.unit_price;
            }
          }

          // Recalculate line total
          updatedItem.lineTotal = updatedItem.quantity * updatedItem.unitPrice;

          return updatedItem;
        }
        return item;
      })
    );
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const vatAmount = (subtotal * formData.vatPercentage) / 100;
  const totalAmount = subtotal + vatAmount;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (lineItems.length === 0) {
      toast({
        title: t("create.errorTitle"),
        description: t("create.validationNoItems"),
        variant: "destructive",
      });
      return;
    }

    if (!formData.clientId) {
      toast({
        title: t("create.errorTitle"),
        description: t("create.validationNoClient"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the document in Supabase
      const { data: documentData, error: documentError } = await supabase
        .from("documents")
        .insert({
          type: formData.type,
          number: formData.number,
          client_id: formData.clientId,
          issue_date: formData.issueDate,
          due_date: formData.dueDate || null,
          status: "Draft",
          subtotal: subtotal,
          vat_percentage: formData.vatPercentage,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          notes: formData.notes || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Create line items
      const lineItemsData = lineItems.map((item) => ({
        document_id: documentData.id,
        item_id: item.itemId || null,
        item_name: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
        user_id: user.id,
      }));

      const { error: lineItemsError } = await supabase
        .from("document_line_items")
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      toast({
        title: t("create.successTitle"),
        description: `${t(`types.${formData.type.toLowerCase()}`)} ${
          formData.number
        } ${t("create.successDescription")}`,
      });

      navigate("/documents");
    } catch (error) {
      console.error("Error creating document:", error);
      toast({
        title: t("create.errorTitle"),
        description: t("create.errorDescription"),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t("create.loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/documents")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("create.backToDocuments")}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("create.title")}
          </h1>
          <p className="text-muted-foreground">{t("create.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t("create.documentDetails")}</CardTitle>
            <CardDescription>{t("create.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t("create.documentType")}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "Quote" | "Invoice") =>
                    handleTypeChange(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quote">{t("types.quote")}</SelectItem>
                    <SelectItem value="Invoice">
                      {t("types.invoice")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">{t("create.documentNumber")}</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder={t("create.documentNumber")}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">{t("create.client")}</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("create.selectClient")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">{t("create.issueDate")}</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                  required
                />
              </div>
              {formData.type === "Invoice" && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">{t("create.dueDate")}</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("create.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder={t("create.notesPlaceholder")}
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
                <CardTitle>{t("create.lineItems")}</CardTitle>
                <CardDescription>{t("create.subtitle")}</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                {t("create.addLineItem")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-muted-foreground mb-4">
                  {t("create.noItemsYet")}
                </div>
                <Button type="button" variant="outline" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("create.addLineItem")}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("create.itemName")}</TableHead>
                    <TableHead>{t("create.description")}</TableHead>
                    <TableHead>{t("create.quantity")}</TableHead>
                    <TableHead>{t("create.unitPrice")}</TableHead>
                    <TableHead>{t("create.lineTotal")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select
                          value={item.itemId}
                          onValueChange={(value) =>
                            updateLineItem(item.id, "itemId", value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("create.selectItem")} />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder={t("create.descriptionPlaceholder")}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(
                              item.id,
                              "unitPrice",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.lineTotal)}
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
                {t("create.summary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vatPercentage">
                      {t("create.vatPercentage")} (%)
                    </Label>
                    <Input
                      id="vatPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.vatPercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vatPercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("create.subtotal")}:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {t("create.vat")} ({formData.vatPercentage}%):
                    </span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>{t("create.totalAmount")}:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/documents")}
          >
            {t("edit.cancel")}
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            {t("create.createDocument")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDocument;
