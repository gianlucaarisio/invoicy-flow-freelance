import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Package,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";

const Dashboard = () => {
  const { t, formatCurrency, formatNumber } = useTranslation("dashboard");
  const [stats, setStats] = useState({
    totalClients: 0,
    totalItems: 0,
    totalDocuments: 0,
    pendingInvoices: 0,
    revenueThisMonth: 0,
    overdueInvoices: 0,
  });
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch counts
      const [clientsResult, itemsResult, documentsResult] = await Promise.all([
        supabase.from("clients").select("*", { count: "exact" }),
        supabase.from("items").select("*", { count: "exact" }),
        supabase.from("documents").select("*", { count: "exact" }),
      ]);

      // Fetch recent documents with client names
      const { data: recentDocs } = await supabase
        .from("documents")
        .select(
          `
          *,
          clients (name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(4);

      const pendingCount =
        documentsResult.data?.filter((doc) => doc.status === "Pending")
          .length || 0;
      const overdueCount =
        documentsResult.data?.filter((doc) => doc.status === "Overdue")
          .length || 0;
      const totalRevenue =
        documentsResult.data?.reduce((sum, doc) => sum + doc.total_amount, 0) ||
        0;

      setStats({
        totalClients: clientsResult.count || 0,
        totalItems: itemsResult.count || 0,
        totalDocuments: documentsResult.count || 0,
        pendingInvoices: pendingCount,
        revenueThisMonth: totalRevenue,
        overdueInvoices: overdueCount,
      });

      setRecentDocuments(recentDocs || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("welcome")}</p>
        </div>
        <Button asChild>
          <Link to="/documents/create">
            <Plus className="h-4 w-4 mr-2" />
            {t("newDocument")}
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalClients")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              +2 {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("itemsServices")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              +5 {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalDocuments")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              +12 {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("revenueThisMonth")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenueThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              +15% {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions")}</CardTitle>
            <CardDescription>{t("quickActionsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/documents/create">
                <Plus className="h-4 w-4 mr-2" />
                {t("createNewDocument")}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/clients">
                <Users className="h-4 w-4 mr-2" />
                {t("manageClients")}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/items">
                <Package className="h-4 w-4 mr-2" />
                {t("addItemsServices")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("recentDocuments")}</CardTitle>
            <CardDescription>{t("recentDocumentsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t("noDocuments")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{doc.number}</span>
                        <span className="text-sm text-muted-foreground">
                          {doc.clients?.name || t("unknownClient")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {t(`documentTypes.${doc.type}`)}
                      </Badge>
                      <Badge
                        className={getStatusColor(doc.status)}
                        variant="secondary"
                      >
                        {t(`documentStatuses.${doc.status}`)}
                      </Badge>
                      <span className="font-medium">
                        {formatCurrency(doc.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/documents">{t("viewAllDocuments")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("pendingInvoices")}
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("awaitingPayment")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("overdueInvoices")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("needAttention")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("paidThisMonth")}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">24</div>
            <p className="text-xs text-muted-foreground">
              {t("invoicesCompleted")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
