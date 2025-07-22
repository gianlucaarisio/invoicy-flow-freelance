import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DocumentViewDialog } from "@/components/DocumentViewDialog";
import { DocumentEditDialog } from "@/components/DocumentEditDialog";
import useTranslation from "@/hooks/useTranslation";

interface Document {
  id: string;
  type: "Quote" | "Invoice";
  number: string;
  client_name: string;
  issue_date: string;
  due_date?: string;
  status: "Draft" | "Issued" | "Accepted" | "Rejected" | "Paid" | "Overdue";
  total_amount: number;
  notes?: string;
}

const Documents = () => {
  const { user } = useAuth();
  const { t, formatDate, formatCurrency, formatNumber } =
    useTranslation("documents");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch documents from Supabase
  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .select(
          `
          *,
          clients(name)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedDocuments =
        data?.map((doc) => ({
          id: doc.id,
          type: doc.type as "Quote" | "Invoice",
          number: doc.number,
          client_name: doc.clients?.name || "Unknown Client",
          issue_date: doc.issue_date,
          due_date: doc.due_date,
          status: doc.status as Document["status"],
          total_amount: parseFloat(doc.total_amount.toString()),
          notes: doc.notes,
        })) || [];

      setDocuments(formattedDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: t("messages.deleteError"),
        description: t("messages.fetchError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Issued":
        return "bg-blue-100 text-blue-800";
      case "Accepted":
        return "bg-emerald-100 text-emerald-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Rejected":
        return "bg-gray-100 text-gray-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "Invoice"
      ? "bg-purple-100 text-purple-800"
      : "bg-indigo-100 text-indigo-800";
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesType =
      typeFilter === "all" || doc.type.toLowerCase() === typeFilter;
    const matchesStatus =
      statusFilter === "all" || doc.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Document Actions
  const handleView = (docId: string) => {
    setSelectedDocumentId(docId);
    setViewDialogOpen(true);
  };

  const handleEdit = (docId: string) => {
    setSelectedDocumentId(docId);
    setEditDialogOpen(true);
  };

  const handleDelete = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      setDocuments(documents.filter((doc) => doc.id !== docId));
      toast({
        title: t("messages.deleteSuccess"),
        description: t("messages.deleteSuccessDescription"),
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: t("messages.deleteError"),
        description: t("messages.deleteErrorDescription"),
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const stats = {
    total: documents.length,
    quotes: documents.filter((doc) => doc.type === "Quote").length,
    invoices: documents.filter((doc) => doc.type === "Invoice").length,
    totalAmount: documents.reduce((sum, doc) => sum + doc.total_amount, 0),
    pending: documents.filter((doc) => doc.status === "Issued").length,
    overdue: documents.filter((doc) => doc.status === "Overdue").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link to="/documents/create">
            <Plus className="h-4 w-4 mr-2" />
            {t("newDocument")}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.quotes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.invoices")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.totalValue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatCurrency(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.pending")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.overdue")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("filters.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("filters.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
            <SelectItem value="quote">{t("types.quotes")}</SelectItem>
            <SelectItem value="invoice">{t("types.invoices")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
            <SelectItem value="draft">{t("statuses.draft")}</SelectItem>
            <SelectItem value="issued">{t("statuses.issued")}</SelectItem>
            <SelectItem value="accepted">{t("statuses.accepted")}</SelectItem>
            <SelectItem value="rejected">{t("statuses.rejected")}</SelectItem>
            <SelectItem value="paid">{t("statuses.paid")}</SelectItem>
            <SelectItem value="overdue">{t("statuses.overdue")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
          <CardDescription>{t("table.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.headers.number")}</TableHead>
                <TableHead>{t("table.headers.type")}</TableHead>
                <TableHead>{t("table.headers.client")}</TableHead>
                <TableHead>{t("table.headers.issueDate")}</TableHead>
                <TableHead>{t("table.headers.dueDate")}</TableHead>
                <TableHead>{t("table.headers.status")}</TableHead>
                <TableHead>{t("table.headers.amount")}</TableHead>
                <TableHead className="text-right">
                  {t("table.headers.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.number}</TableCell>
                  <TableCell>
                    <Badge
                      className={getTypeColor(doc.type)}
                      variant="secondary"
                    >
                      {t(`types.${doc.type.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.client_name}</TableCell>
                  <TableCell>{formatDate(doc.issue_date, "P")}</TableCell>
                  <TableCell>
                    {doc.due_date ? formatDate(doc.due_date, "P") : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(doc.status)}
                      variant="secondary"
                    >
                      {t(`statuses.${doc.status.toLowerCase()}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(doc.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(doc.id)}
                        title={t("actions.view")}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(doc.id)}
                        title={t("actions.edit")}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title={t("actions.download")}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(doc.id)}
                        title={t("actions.delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">
                {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                  ? t("empty.noResults")
                  : t("empty.noDocuments")}
              </div>
              {!searchTerm &&
                typeFilter === "all" &&
                statusFilter === "all" && (
                  <Button asChild className="mt-4">
                    <Link to="/documents/create">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("empty.createFirst")}
                    </Link>
                  </Button>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <DocumentViewDialog
        documentId={selectedDocumentId}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      {/* Edit Dialog */}
      <DocumentEditDialog
        documentId={selectedDocumentId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onDocumentUpdated={fetchDocuments}
      />
    </div>
  );
};

export default Documents;
