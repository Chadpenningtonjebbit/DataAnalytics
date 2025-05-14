import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CSVData {
  data: Record<string, string>[];
  fields: string[];
  rowCount: number;
  preview: boolean;
}

interface CSVTableProps {
  fileUrl: string;
}

export function CSVTable({ fileUrl }: CSVTableProps) {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCSVData = async () => {
      if (!fileUrl) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/csv?url=${encodeURIComponent(fileUrl)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCsvData(data);
      } catch (err) {
        console.error('Error fetching CSV data:', err);
        setError('Failed to load CSV data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCSVData();
  }, [fileUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 h-full">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading CSV data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive border border-destructive/20 rounded-md">
        {error}
      </div>
    );
  }

  if (!csvData || !csvData.data || csvData.data.length === 0) {
    return (
      <div className="p-4 text-muted-foreground border rounded-md">
        No data available in this CSV file.
      </div>
    );
  }

  return (
    <div className="rounded-md border h-full flex flex-col">
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              {csvData.fields.map((field, index) => (
                <TableHead 
                  key={index} 
                  className="font-medium whitespace-nowrap"
                >
                  {field}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {csvData.data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {csvData.fields.map((field, colIndex) => (
                  <TableCell 
                    key={colIndex}
                    className="whitespace-nowrap max-w-[300px] overflow-hidden text-ellipsis"
                  >
                    {row[field] || '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {csvData.preview && csvData.rowCount > csvData.data.length && (
        <div className="p-2 text-xs text-muted-foreground text-center border-t">
          Showing {csvData.data.length} of {csvData.rowCount} rows
        </div>
      )}
    </div>
  );
} 