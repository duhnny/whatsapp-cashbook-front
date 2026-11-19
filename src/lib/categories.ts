// Mirrors the TransactionCategory enum from the backend. The contract package
// exports the query/response types but not the enum itself, so the labels and
// the union live here until it does.

export type Category =
  | 'payment'
  | 'transportation'
  | 'food_and_beverage'
  | 'groceries'
  | 'bills'
  | 'subscriptions'
  | 'health'
  | 'appearance'
  | 'others'

export const CATEGORIES: ReadonlyArray<{ value: Category; label: string }> = [
  { value: 'payment', label: 'Payment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'food_and_beverage', label: 'Food & beverage' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'bills', label: 'Bills' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'health', label: 'Health' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'others', label: 'Others' },
]

export const CATEGORY_LABELS: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.value, category.label]),
) as Record<Category, string>

export const isCategory = (value: string): value is Category =>
  CATEGORIES.some((category) => category.value === value)
