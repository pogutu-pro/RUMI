import { create } from 'zustand';
import { 
  techSupportApi, 
  TechSupportUser, 
  TechSupportHostel, 
  TechSupportTransaction, 
  TechSupportTicket,
  TechSupportLog,
  TechSupportMessage
} from '@/features/support';

interface TechSupportState {
  // Users
  users: TechSupportUser[];
  isLoadingUsers: boolean;
  fetchUsers: (params?: any) => Promise<void>;
  
  // Hostels
  hostels: TechSupportHostel[];
  isLoadingHostels: boolean;
  fetchHostels: (params?: any) => Promise<void>;

  // Transactions
  transactions: TechSupportTransaction[];
  isLoadingTransactions: boolean;
  fetchTransactions: (params?: any) => Promise<void>;

  // Tickets
  tickets: TechSupportTicket[];
  isLoadingTickets: boolean;
  fetchTickets: (params?: any) => Promise<void>;

  // Messaging
  messages: TechSupportMessage[];
  isLoadingMessages: boolean;
  fetchMessages: (params?: any) => Promise<void>;

  // Logs
  logs: TechSupportLog[];
  isLoadingLogs: boolean;
  fetchLogs: (params?: any) => Promise<void>;

  // Shared
  error: string | null;
  clearError: () => void;
}

export const useTechSupportStore = create<TechSupportState>((set) => ({
  // Users
  users: [],
  isLoadingUsers: false,
  error: null, // Initial state for error
  fetchUsers: async (params) => {
    set({ isLoadingUsers: true, error: null });
    try {
      // Mocking response for now as backend might not be ready
      // const response = await techSupportApi.getUsers(params);
      // set({ users: response.data });
      
      // MOCK DATA
      setTimeout(() => {
        set({
          users: [
             { id: '1', first_name: "Alice", last_name: "Johnson", email: "alice@student.uon.ac.ke", role: "student", is_active: true, is_verified: true, phone_number: "+254712345678", date_joined: "2023-09-01" },
             { id: '2', first_name: "Bob", last_name: "Smith", email: "bob@landlord.com", role: "landlord", is_active: true, is_verified: false, phone_number: "+254722334455", date_joined: "2023-09-05" },
          ],
          isLoadingUsers: false
        });
      }, 500);
    } catch (error: any) {
      set({ error: error.message, isLoadingUsers: false });
    }
  },

  // Hostels
  hostels: [],
  isLoadingHostels: false,
  fetchHostels: async (params) => {
    set({ isLoadingHostels: true, error: null });
    try {
      // const response = await techSupportApi.getHostels(params);
      // set({ hostels: response.data });
      
      // MOCK DATA
      setTimeout(() => {
        set({
          hostels: [
            { id: '1', name: "Sunshine Apartments", landlord_name: "Bob Smith", location: "Juja, Gate C", rooms_count: 45, status: "active", is_verified: true },
            { id: '2', name: "Green Valley Hostels", landlord_name: "David Wilson", location: "Ruiru, Kimbo", rooms_count: 30, status: "pending", is_verified: false },
          ],
          isLoadingHostels: false
        });
      }, 500);
    } catch (error: any) {
      set({ error: error.message, isLoadingHostels: false });
    }
  },

  // Transactions
  transactions: [],
  isLoadingTransactions: false,
  fetchTransactions: async (params) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      // const response = await techSupportApi.getTransactions(params);
      // set({ transactions: response.data });
      
      // MOCK DATA
      setTimeout(() => {
        set({
          transactions: [
             { id: "TXN-12345", student_name: "Alice Johnson", amount: 12000, type: "Rent", status: "success", date: "2023-10-01 10:30 AM", transaction_reference: "REF123" },
             { id: "TXN-67890", student_name: "Bob Smith", amount: 15000, type: "Rent", status: "failed", date: "2023-10-02 02:15 PM", transaction_reference: "REF456" },
          ],
          isLoadingTransactions: false
        });
      }, 500);
    } catch (error: any) {
      set({ error: error.message, isLoadingTransactions: false });
    }
  },

  // Tickets
  tickets: [],
  isLoadingTickets: false,
  fetchTickets: async (params) => {
    set({ isLoadingTickets: true, error: null });
    try {
      // const response = await techSupportApi.getTickets(params);
      // set({ tickets: response.data });
      
      // MOCK DATA
      setTimeout(() => {
        set({
          tickets: [
             { id: "TKT-1001", subject: "Unable to login", user_name: "Alice Johnson", category: "Account", priority: "high", status: "open", created_at: "2h ago" },
             { id: "TKT-1002", subject: "Payment failed", user_name: "Bob Smith", category: "Payment", priority: "critical", status: "in_progress", created_at: "4h ago" },
          ],
          isLoadingTickets: false
        });
      }, 500);
    } catch (error: any) {
      set({ error: error.message, isLoadingTickets: false });
    }
  },

  // Messaging
  messages: [],
  isLoadingMessages: false,
  fetchMessages: async (params) => {
    set({ isLoadingMessages: true, error: null });
    try {
      // const response = await techSupportApi.getMessages(params);
      // set({ messages: response.data });
      
      // MOCK DATA
      setTimeout(() => {
        set({
          messages: [
            { id: '1', sender: 'Alice Johnson', recipient: 'Support', content: 'I cannot access my account settings.', timestamp: '10:30 AM', is_read: false },
            { id: '2', sender: 'Support', recipient: 'Alice Johnson', content: 'We are looking into it.', timestamp: '10:35 AM', is_read: true },
          ],
          isLoadingMessages: false
        });
      }, 500);
    } catch (error: any) {
      set({ error: error.message, isLoadingMessages: false });
    }
  },

  // Logs
  logs: [],
  isLoadingLogs: false,
  fetchLogs: async (params) => {
    set({ isLoadingLogs: true, error: null });
    try {
      // const response = await techSupportApi.getLogs(params);
      // set({ logs: response.data });
      
      // MOCK DATA
      setTimeout(() => {
        set({
          logs: [
            { id: '1', user: 'TechAdmin', action: 'Verified User', details: 'Verified user Alice Johnson', ip_address: '192.168.1.1', timestamp: '2023-10-05 10:00 AM' },
            { id: '2', user: 'TechAdmin', action: 'Flagged Hostel', details: 'Flagged Elite Residency for review', ip_address: '192.168.1.1', timestamp: '2023-10-05 11:30 AM' },
          ],
          isLoadingLogs: false
        });
      }, 500);
    } catch (error: any) {
      set({ error: error.message, isLoadingLogs: false });
    }
  },

  // Shared
  clearError: () => set({ error: null }),
}));



