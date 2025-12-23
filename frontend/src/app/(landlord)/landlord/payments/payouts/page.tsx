'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  History, 
  CalendarDays,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLandlordPayouts, usePaymentStats } from '@/features/payments';
import { toast } from 'sonner';

export default function PayoutsPage() {
  const { data: payoutsData, isLoading: isPayoutsLoading } = useLandlordPayouts();
  const { data: stats } = usePaymentStats();
  const [isRequestModalOpen, setIsRequestModalOpen] = React.useState(false);

  // Projections: In a real app this would come from an endpoint like /payouts/projections/
  // For now we calculate it from pending amount if available, or show empty state if 0
  const pendingAmount = stats?.pendingAmount || 0;

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Payout request submitted successfully. Processing time: 24h.");
    setIsRequestModalOpen(false);
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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">Payouts & Settlements</h1>
          <p className="text-slate-700 dark:text-slate-300 max-w-xl text-lg md:text-xl font-medium">
             Manage your withdrawals and view settlement history.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Balance Card (Standardized UI) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
          <Card className="border shadow-sm bg-card overflow-hidden">
              <CardContent className="p-10">
                 <div className="flex justify-between items-start mb-10">
                   <div className="space-y-1">
                     <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Available For Payout</p>
                     <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-950 dark:text-white mt-3">
                       KES {stats?.availableBalance?.toLocaleString() || '0'}
                     </h2>
                   </div>
                   <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                     <Wallet className="h-7 w-7 text-slate-900 dark:text-slate-300" />
                   </div>
                 </div>

                 <div className="flex gap-4">
                   <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
                     <DialogTrigger asChild>
                       <Button className="h-14 px-8 bg-slate-950 dark:bg-white text-white dark:text-slate-900 hover:opacity-95 rounded-xl font-black text-lg flex-1 shadow-lg">
                         Request Payout
                         <ArrowUpRight className="ml-2 h-6 w-6" />
                       </Button>
                     </DialogTrigger>
                     {/* Dialog content should be updated for visibility too if needed, but the main page is priority */}
                     <DialogContent className="sm:max-w-md">
                         <DialogHeader>
                           <DialogTitle className="text-xl font-bold">Withdraw Funds</DialogTitle>
                           <DialogDescription className="text-slate-700 dark:text-slate-400">
                             Funds will be sent to your registered M-Pesa account.
                           </DialogDescription>
                         </DialogHeader>
                         <form onSubmit={handleRequestPayout} className="space-y-4 py-2">
                           <div className="space-y-2">
                              <Label htmlFor="amount" className="font-bold">Amount (KES)</Label>
                              <Input id="amount" placeholder="e.g. 50000" type="number" required className="h-12 text-lg font-bold border-slate-300" />
                              <p className="text-sm text-slate-700 dark:text-slate-500 font-bold">Available: KES {stats?.availableBalance?.toLocaleString() || '0'}</p>
                           </div>
                           <DialogFooter className="gap-2">
                             <DialogClose asChild>
                               <Button type="button" variant="secondary" className="font-bold">Cancel</Button>
                             </DialogClose>
                             <Button type="submit" className="font-bold">Confirm Withdrawal</Button>
                           </DialogFooter>
                         </form>
                     </DialogContent>
                   </Dialog>
                   
                   <Button variant="outline" className="h-14 px-6 border-slate-300 dark:border-slate-700 font-black rounded-xl text-slate-900 dark:text-slate-200 shadow-sm">
                     <CreditCard className="mr-2 h-6 w-6" />
                     Manage Accounts
                   </Button>
                 </div>
              </CardContent>
           </Card>

          {/* Upcoming Projections */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-card">
              <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <CardTitle className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                  Incoming Settlements
                </CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-400 font-medium">Estimated funds from pending tenant payments.</CardDescription>
              </CardHeader>
             <CardContent className="p-0">
               {pendingAmount > 0 ? (
                    <div className="p-6 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-black">
                             <Clock className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="font-black text-slate-950 dark:text-white text-lg">Pending Rent Collection</p>
                             <p className="text-sm text-slate-700 dark:text-slate-400 font-bold">Expected within 7 days</p>
                          </div>
                       </div>
                       <p className="font-black text-slate-950 dark:text-white text-2xl">+ KES {pendingAmount.toLocaleString()}</p>
                    </div>
               ) : (
                   <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30">
                       <p className="text-sm text-slate-500 font-medium">No pending settlements found.</p>
                   </div>
               )}
                              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40">
                  <p className="text-xs text-slate-600 dark:text-slate-500 font-black flex items-center justify-center gap-2 uppercase tracking-wide">
                    <AlertCircle className="h-4 w-4" />
                    Settlements are processed automatically every Tuesday.
                  </p>
                </div>
             </CardContent>
          </Card>
        </motion.div>

        {/* Payout History */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-card h-full">
            <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black text-slate-950 dark:text-white">Transfer History</CardTitle>
                <CardDescription className="text-slate-700 dark:text-slate-400 font-medium">Recent withdrawals</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-900">
                 <CalendarDays className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               {isPayoutsLoading ? (
                 <div className="p-8 text-center text-slate-400 font-medium">Loading history...</div>
               ) : payoutsData?.data && payoutsData.data.length > 0 ? (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                    {payoutsData.data.slice(0, 6).map((payout: any) => (
                      <div key={payout.id} className="p-5 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-colors">
                         <div className={cn(
                           "h-12 w-12 rounded-full flex items-center justify-center border-2",
                           payout.status === 'completed' ? "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                           payout.status === 'pending' ? "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                           "bg-red-100 border-red-300 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                         )}>
                            {payout.status === 'completed' ? <CheckCircle className="h-6 w-6" /> :
                             payout.status === 'pending' ? <Clock className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-black text-slate-950 dark:text-white text-base truncate">
                              To {payout.recipient || 'M-PESA Account'}
                           </p>
                           <p className="text-sm text-slate-700 dark:text-slate-500 font-bold">
                             {format(new Date(payout.createdAt || Date.now()), 'MMM d, h:mm a')}
                           </p>
                         </div>
                         <div className="text-right">
                           <p className="font-black text-slate-950 dark:text-white text-base">- KES {payout.amount.toLocaleString()}</p>
                           <Badge variant="outline" className="text-[11px] h-6 px-2 uppercase font-black border-0 bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-400">
                              {payout.status}
                           </Badge>
                         </div>
                      </div>
                   ))}
                 </div>
               ) : (
                 <div className="p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                       <History className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold">No payouts yet</p>
                    <p className="text-xs text-slate-500">Your transfer history will appear here.</p>
                 </div>
               )}
               
               <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                  <Button variant="outline" className="w-full h-12 font-black border-dashed border-slate-400 dark:border-slate-700 text-slate-800 dark:text-slate-300 hover:text-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all text-base">
                    <Download className="mr-2 h-5 w-5" /> Download Statement
                  </Button>
               </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
