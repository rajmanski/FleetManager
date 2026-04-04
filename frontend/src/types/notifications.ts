export type Notification = {
  id: number
  user_id: number
  type: string
  message: string | null
  is_read: boolean | null
  created_at: string | null
}
