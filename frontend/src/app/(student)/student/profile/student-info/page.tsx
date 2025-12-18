'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, School, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const studentInfoSchema = z.object({
  university: z.string().min(1, { message: 'Please select a university.' }),
  campus: z.string().min(1, { message: 'Please select a campus.' }),
  studentId: z.string().min(1, { message: 'Student ID is required.' }),
  program: z.string().min(2, { message: 'Program/Course is required.' }),
  yearOfStudy: z.string().min(1, { message: 'Please select your year of study.' }),
  graduationYear: z.string().min(4, { message: 'Please enter expected graduation year.' }),
  highSchool: z.string().min(2, { message: 'High School name is required.' }),
});

type StudentInfoValues = z.infer<typeof studentInfoSchema>;

export default function StudentInfoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  // Default values - in real app fetch from API
  const defaultValues: Partial<StudentInfoValues> = {
    university: '',
    campus: '',
    studentId: '',
    program: '',
    yearOfStudy: '',
    graduationYear: '',
    highSchool: '',
  };

  const form = useForm<StudentInfoValues>({
    resolver: zodResolver(studentInfoSchema),
    defaultValues,
    mode: 'onChange',
  });

  async function onSubmit(data: StudentInfoValues) {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success('Student details updated', {
        description: 'Your academic information has been saved.',
      });
      
      router.refresh();
      // Optionally redirect back
      // router.push('/student/profile');
    } catch (error) {
      toast.error('Something went wrong', {
        description: 'Could not update student details.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Details</h1>
          <p className="text-muted-foreground">
            Manage your academic information for verification
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-emerald-600" />
                Institution Information
              </CardTitle>
              <CardDescription>
                Details about your university and campus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>University / College</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select institution" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="uon">University of Nairobi</SelectItem>
                          <SelectItem value="ku">Kenyatta University</SelectItem>
                          <SelectItem value="jkuat">JKUAT</SelectItem>
                          <SelectItem value="strathmore">Strathmore University</SelectItem>
                          <SelectItem value="usiu">USIU Africa</SelectItem>
                          <SelectItem value="mk">Mount Kenya University</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="campus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="main">Main Campus</SelectItem>
                          <SelectItem value="city">City Campus</SelectItem>
                          <SelectItem value="westlands">Westlands Campus</SelectItem>
                          <SelectItem value="karen">Karen Campus</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Registration / Admission Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. C01/1234/2023" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is used to verify your student status.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
                Academic Program
              </CardTitle>
              <CardDescription>
                Details about your course and study year.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="program"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course / Program</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Bachelor of Science in Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="yearOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Year of Study</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Year 1</SelectItem>
                          <SelectItem value="2">Year 2</SelectItem>
                          <SelectItem value="3">Year 3</SelectItem>
                          <SelectItem value="4">Year 4</SelectItem>
                          <SelectItem value="5">Year 5</SelectItem>
                          <SelectItem value="6">Year 6</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="graduationYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Graduation Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-emerald-600" />
                Secondary Education
              </CardTitle>
              <CardDescription>
                Your high school information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="highSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>High School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alliance High School" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/student/profile">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Details
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
