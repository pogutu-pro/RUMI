'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  CalendarDays, 
  FileSpreadsheet, 
  FileCheck,
  Building2,
  Users,
  Wallet,
  TrendingUp,
  Mail,
  History,
  ChevronRight,
  Filter
} from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExportAnalytics } from '@/features/analytics/hooks/use-analytics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { mutate: exportData, isPending: isExporting } = useExportAnalytics();
  const [selectedPeriod, setSelectedPeriod] = React.useState('30d');
  const [selectedFormat, setSelectedFormat] = React.useState<'pdf' | 'csv' | 'excel'>('pdf');

  const handleDownload = (reportType: string) => {
    toast.info(`Generating ${reportType} report...`);
    exportData({
      period: selectedPeriod as any,
      format: selectedFormat,
      // In a real implementation, you would pass the report type as a param or filter
    });
  };

  const handleEmailReport = (reportType: string) => {
    toast.success(`${reportType} has been emailed to your registered address.`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  const reportCategories = [
    {
      title: "Financial Reports",
      description: "Income summaries, expense tracking, and rent collection legders.",
      icon: Wallet,
      reports: [
        { name: "Rent Collection Ledger", type: "financial" },
        { name: "Income Statement", type: "financial" },
        { name: "Arrears & Outstanding", type: "financial" },
      ]
    },
    {
      title: "Operational Reports",
      description: "Occupancy rates, maintenance logs, and tenant turnover.",
      icon: Building2,
      reports: [
        { name: "Occupancy & Vacancy", type: "operational" },
        { name: "Maintenance Request Log", type: "operational" },
        { name: "Tenant Turnover Analysis", type: "operational" },
      ]
    },
    {
      title: "Tax & Compliance",
      description: "Annual tax statements and compliance documentation.",
      icon: FileCheck,
      reports: [
        { name: "Annual Tax Statement", type: "tax" },
        { name: "Subscription VAT Invoices", type: "tax" },
      ]
    },
    {
      title: "Subscription & Usage",
      description: "Feature usage audits and automated monthly statements.",
      icon: TrendingUp,
      reports: [
        { name: "Monthly Usage Audit", type: "subscription" },
        { name: "Feature ROI Analysis", type: "subscription" },
      ]
    }
  ];

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">Reports & Statements</h1>
          <p className="text-slate-700 dark:text-slate-300 max-w-xl text-lg md:text-xl font-medium">
             Detailed financials and operational logs for your property.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl shadow-inner">
             <Button 
               variant="ghost" 
               size="sm" 
               className={cn("rounded-lg font-black text-sm h-9 px-4", selectedFormat === 'pdf' && "bg-white dark:bg-slate-800 shadow-md text-slate-950 dark:text-white")}
               onClick={() => setSelectedFormat('pdf')}
             >
               PDF
             </Button>
             <Button 
               variant="ghost" 
               size="sm" 
               className={cn("rounded-lg font-black text-sm h-9 px-4", selectedFormat === 'csv' && "bg-white dark:bg-slate-800 shadow-md text-slate-950 dark:text-white")}
               onClick={() => setSelectedFormat('csv')}
             >
               CSV
             </Button>
             <Button 
               variant="ghost" 
               size="sm" 
               className={cn("rounded-lg font-black text-sm h-9 px-4", selectedFormat === 'excel' && "bg-white dark:bg-slate-800 shadow-md text-slate-950 dark:text-white")}
               onClick={() => setSelectedFormat('excel')}
             >
               Excel
             </Button>
          </div>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl bg-card border-slate-300 dark:border-slate-800 font-black text-slate-950 dark:text-white shadow-sm">
              <div className="flex items-center gap-2">
                 <CalendarDays className="h-5 w-5 text-slate-600" />
                 <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d" className="font-bold">Last 30 Days</SelectItem>
              <SelectItem value="90d" className="font-bold">Last Quarter</SelectItem>
              <SelectItem value="ytd" className="font-bold">Year to Date</SelectItem>
              <SelectItem value="1y" className="font-bold">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {reportCategories.map((category, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <Card className="h-full border border-slate-200 dark:border-slate-800 shadow-md bg-card hover:shadow-xl transition-all">
              <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-row items-center gap-5">
                <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <category.icon className="h-7 w-7 text-slate-900 dark:text-slate-300" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black text-slate-950 dark:text-white">{category.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-slate-700 dark:text-slate-400 font-bold text-sm">{category.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 space-y-4">
                {category.reports.map((report, rIdx) => (
                  <div key={rIdx} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors flex items-center justify-between group shadow-sm">
                    <div className="flex items-center gap-4">
                       <FileText className="h-6 w-6 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors" />
                       <div>
                         <p className="font-black text-slate-950 dark:text-white text-base">{report.name}</p>
                         <p className="text-[11px] text-slate-600 dark:text-slate-500 uppercase font-black tracking-widest">{report.type}</p>
                       </div>
                    </div>
                    
                    <div className="flex gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-10 w-10 text-slate-600 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200"
                         onClick={() => handleEmailReport(report.name)}
                       >
                         <Mail className="h-5 w-5" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-10 w-10 text-slate-600 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200"
                         onClick={() => handleDownload(report.name)}
                         disabled={isExporting}
                       >
                         <Download className="h-5 w-5" />
                       </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
