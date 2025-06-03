import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { VacationPost } from './vacationService';
import { Profile } from './profileService';

interface ReportOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  type: 'vacations' | 'bookings' | 'earnings' | 'payments';
}

export const generatePDFReport = async (options: ReportOptions) => {
  try {
    const doc = new jsPDF();
    const data = await fetchReportData(options);

    // Add title
    doc.setFontSize(20);
    doc.text(`${options.type.charAt(0).toUpperCase() + options.type.slice(1)} Report`, 14, 20);

    // Add date range if provided
    if (options.startDate && options.endDate) {
      doc.setFontSize(12);
      doc.text(
        `Period: ${format(options.startDate, 'MMM d, yyyy')} - ${format(options.endDate, 'MMM d, yyyy')}`,
        14,
        30
      );
    }

    // Add data table
    const tableData = formatDataForTable(data, options.type);
    (doc as any).autoTable({
      startY: 40,
      head: [tableData.headers],
      body: tableData.rows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    return doc;
  } catch (error: any) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

export const exportDataToCSV = async (options: ReportOptions) => {
  try {
    const data = await fetchReportData(options);
    const csvData = formatDataForCSV(data, options.type);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${options.type}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error exporting data to CSV:', error);
    throw error;
  }
};

const fetchReportData = async (options: ReportOptions) => {
  let query;

  switch (options.type) {
    case 'vacations':
      query = supabase
        .from('vacation_posts')
        .select(`
          *,
          doctor:profiles!vacation_posts_doctor_id_fkey (*),
          establishment:profiles!vacation_posts_establishment_id_fkey (*)
        `);
      break;

    case 'bookings':
      query = supabase
        .from('vacation_bookings')
        .select(`
          *,
          vacation:vacation_posts (*),
          doctor:profiles!vacation_posts_doctor_id_fkey (*),
          establishment:profiles!vacation_posts_establishment_id_fkey (*)
        `);
      break;

    case 'earnings':
      query = supabase
        .from('payments')
        .select(`
          *,
          booking:vacation_bookings (
            *,
            vacation:vacation_posts (*)
          )
        `)
        .eq('status', 'completed');
      break;

    case 'payments':
      query = supabase
        .from('payments')
        .select(`
          *,
          booking:vacation_bookings (
            *,
            vacation:vacation_posts (*)
          )
        `);
      break;
  }

  if (options.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  if (options.userId) {
    query = query.eq('user_id', options.userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
};

const formatDataForTable = (data: any[], type: string) => {
  const headers = [];
  const rows = [];

  switch (type) {
    case 'vacations':
      headers.push(['Doctor', 'Establishment', 'Start Date', 'End Date', 'Rate', 'Status']);
      rows.push(...data.map((item: VacationPost) => [
        `${item.doctor.first_name} ${item.doctor.last_name}`,
        item.establishment.first_name,
        format(new Date(item.start_date), 'MMM d, yyyy'),
        format(new Date(item.end_date), 'MMM d, yyyy'),
        `${item.hourly_rate}€/hour`,
        item.status
      ]));
      break;

    case 'bookings':
      headers.push(['Doctor', 'Establishment', 'Start Date', 'End Date', 'Status', 'Amount']);
      rows.push(...data.map((item: any) => [
        `${item.doctor.first_name} ${item.doctor.last_name}`,
        item.establishment.first_name,
        format(new Date(item.vacation.start_date), 'MMM d, yyyy'),
        format(new Date(item.vacation.end_date), 'MMM d, yyyy'),
        item.status,
        `${item.amount}€`
      ]));
      break;

    case 'earnings':
    case 'payments':
      headers.push(['Date', 'Amount', 'Status', 'Booking ID', 'Description']);
      rows.push(...data.map((item: any) => [
        format(new Date(item.created_at), 'MMM d, yyyy'),
        `${item.amount}€`,
        item.status,
        item.booking_id,
        item.description || '-'
      ]));
      break;
  }

  return { headers, rows };
};

const formatDataForCSV = (data: any[], type: string) => {
  const { headers, rows } = formatDataForTable(data, type);
  const csvRows = [
    headers[0].join(','),
    ...rows.map(row => row.join(','))
  ];
  return csvRows.join('\n');
}; 