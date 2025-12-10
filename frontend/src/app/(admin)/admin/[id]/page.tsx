"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Page() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      <div>
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resource Details</h1>
        <p className="mt-2 text-slate-500">Viewing details for ID: <span className="font-mono text-slate-700">{id}</span></p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Resource Information</h3>
            <p className="max-w-sm mt-2">
              Detailed information for this resource is currently being retrieved. 
              Please verify the resource ID or return to the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
