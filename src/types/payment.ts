// Payment type matching Supabase payments table
export type PaymentStatus = "pending" | "completed" | "failed";
export type PaymentMethod = "credit_card" | "paypal" | "bank_transfer";

export interface Payment {
  id: number; // Serial primary key
  student_id: string; // UUID, references student_profiles(id)
  amount: number; // numeric(10,2), check >= 1.00
  status: PaymentStatus; // default 'pending'
  payment_method: PaymentMethod;
  transaction_id?: string | null; // Unique
  created_at: string;
}
