"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { usersApi } from "@/features/users/api/users";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["student", "landlord", "caretaker", "tech_support"]),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(), // Optional if auto-generated or invitation flow
});

interface AddUserModalProps {
  defaultRole?: "student" | "landlord" | "caretaker" | "tech_support";
}

export function AddUserModal({ defaultRole }: AddUserModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: defaultRole || "student",
      phone: "",
      password: "password123", 
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Depending on role, we might call different endpoints or standard register
      // For Tech Support, we use our new specific logic or generic create
      
      // NOTE: Using createTechSupport for simplicity if role is tech_support, 
      // otherwise defaulting to the same API function which handles roles.
      // In a real app, 'register' might not allow setting role directly without admin privileges.
      // We assume the backend accepts a role or we use specific endpoints.
      
      await usersApi.createTechSupport({
          ...values,
          role: values.role as any // Type assertion for now
      });

      toast.success(`${values.role} added successfully`);
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    } catch (error: any) {
        console.error(error);
        toast.error(error?.response?.data?.message || "Failed to add user");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          {defaultRole ? `Add ${defaultRole === 'tech_support' ? 'Tech Support' : defaultRole.charAt(0).toUpperCase() + defaultRole.slice(1)}` : "Add New User"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new account. They will receive an email to set up their password.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="landlord">Landlord</SelectItem>
                      <SelectItem value="caretaker">Caretaker</SelectItem>
                      <SelectItem value="tech_support">Tech Support</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
