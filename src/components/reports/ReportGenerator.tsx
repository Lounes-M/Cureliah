import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { generatePDFReport, exportDataToCSV } from '@/services/reportService';
import { Loader2, FileDown, FileText } from 'lucide-react';

export const ReportGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'vacations' | 'bookings' | 'earnings' | 'payments'>('vacations');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      const doc = await generatePDFReport({
        type: reportType,
        startDate,
        endDate
      });
      doc.save(`${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({
        title: 'Success',
        description: 'PDF report generated successfully',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      await exportDataToCSV({
        type: reportType,
        startDate,
        endDate
      });
      toast({
        title: 'Success',
        description: 'CSV file exported successfully',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Error',
        description: 'Failed to export CSV file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select
              value={reportType}
              onValueChange={(value: any) => setReportType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacations">Vacations</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="earnings">Earnings</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex gap-2">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Start date"
              />
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="End date"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGeneratePDF}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
            <Button
              onClick={handleExportCSV}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 