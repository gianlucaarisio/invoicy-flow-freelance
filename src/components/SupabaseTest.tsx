
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ConnectionTest {
  id: string;
  test_field: string;
  created_at: string;
}

export default function SupabaseTest() {
  const [data, setData] = useState<ConnectionTest[]>([]);
  const [newField, setNewField] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('connection_test')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data from Supabase",
        variant: "destructive"
      });
    }
  };

  const addRecord = async () => {
    if (!newField.trim()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('connection_test')
        .insert([{ test_field: newField }]);

      if (error) throw error;
      
      setNewField('');
      fetchData();
      toast({
        title: "Success",
        description: "Record added successfully!"
      });
    } catch (error) {
      console.error('Error adding record:', error);
      toast({
        title: "Error",
        description: "Failed to add record",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('connection_test')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      fetchData();
      toast({
        title: "Success",
        description: "Record deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Test creating, reading, and deleting records from the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="newField">Add New Record</Label>
            <Input
              id="newField"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              placeholder="Enter test text..."
              onKeyPress={(e) => e.key === 'Enter' && addRecord()}
            />
          </div>
          <Button 
            onClick={addRecord} 
            disabled={loading || !newField.trim()}
            className="mt-6"
          >
            {loading ? 'Adding...' : 'Add Record'}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">Records in Database:</h3>
          {data.length === 0 ? (
            <p className="text-gray-500">No records found</p>
          ) : (
            <div className="space-y-2">
              {data.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{record.test_field}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteRecord(record.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={fetchData} variant="outline" className="w-full">
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  );
}
