"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Book, 
  FileText, 
  ExternalLink, 
  HelpCircle,
  Shield,
  AlertTriangle,
  Mail,
  ChevronRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function TechSupportKnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "How do I verify a landlord's identity?",
      answer: "To verify a landlord, check their uploaded documents (ID/Passport and Title Deed/Lease). Ensure the names match their profile. If everything is correct, click the 'Verify' button in the User Management page. If documents are unclear, request re-upload."
    },
    {
      question: "What is the procedure for handling payment disputes?",
      answer: "When a student reports a payment issue, first verify the transaction ID in the Payments tab. If the transaction is marked as 'Failed' but money was deducted, escalate to Super Admin for reconciliation. If it's a double charge, initiate a refund request."
    },
    {
      question: "How do I flag a hostel for safety violations?",
      answer: "Go to the Hostel Support page, search for the hostel, and click the 'Flag' option. You must provide a reason (e.g., 'Unsafe conditions reported'). This will hide the hostel from search results until a physical inspection is done."
    },
    {
      question: "Can I reset a user's password?",
      answer: "No, for security reasons, agents cannot see or reset passwords manually. Guide the user to the 'Forgot Password' link on the login page. If they are locked out, you can unlock their account from the User Management page."
    },
    {
      question: "What should I do if the system is slow?",
      answer: "Check the 'System Status' on your dashboard. If all systems are operational, it might be a local network issue. If there is a system-wide degradation, an alert will be visible on the dashboard."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">
            Resources, guides, and tools for support agents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Contact Super Admin
          </Button>
          <Button>
            <Zap className="mr-2 h-4 w-4" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Search Hero */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-8 md:p-12 border border-border/50">
        <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="mb-2">Internal Resources</Badge>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            How can we help you help others?
          </h2>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search for guides, policies, or error codes..." 
              className="pl-10 h-12 text-lg bg-background/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Main Content - FAQs */}
        <div className="md:col-span-8 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                Standard Operating Procedures
              </CardTitle>
              <CardDescription>
                Common scenarios and approved workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </Accordion>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Identity Verification Policy
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Guidelines on acceptable documents for students and landlords verification processes.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Refund & Dispute Policy
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Steps to validate claims, process refunds, and handle fraudulent transaction reports.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar - Quick Links & status */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">Agent Tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline" className="justify-start h-auto py-3 bg-background hover:bg-accent hover:text-accent-foreground border-border/50">
                <Shield className="mr-3 h-5 w-5 text-indigo-500" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Admin Dashboard</span>
                  <span className="text-[10px] text-muted-foreground">Access main control panel</span>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 bg-background hover:bg-accent hover:text-accent-foreground border-border/50">
                <FileText className="mr-3 h-5 w-5 text-blue-500" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Incident Report</span>
                  <span className="text-[10px] text-muted-foreground">Log a new system incident</span>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3 bg-background hover:bg-accent hover:text-accent-foreground border-border/50">
                <AlertTriangle className="mr-3 h-5 w-5 text-amber-500" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Emergency Contacts</span>
                  <span className="text-[10px] text-muted-foreground">View escalation matrix</span>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Need more help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-4">
                If you encounter a scenario not covered here, please consult the Super Admin.
              </p>
              <Button size="sm" className="w-full">
                Contact Lead
              </Button>
            </CardContent>
          </Card>
          
          <div className="rounded-lg bg-indigo-900/10 p-4 border border-indigo-500/20">
            <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Pro Tip
            </h4>
            <p className="text-xs text-indigo-800 dark:text-indigo-300">
              You can quick-search any ticket ID from the global search bar by typing "TKT-" followed by the number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
