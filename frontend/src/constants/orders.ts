export const ORDER_STATUSES = ['New', 'Planned', 'InProgress', 'Completed', 'Cancelled'] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
