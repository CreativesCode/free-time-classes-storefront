export type NotificationType =
  | "booking_request"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled";

export interface Notification {
  id: number;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}
