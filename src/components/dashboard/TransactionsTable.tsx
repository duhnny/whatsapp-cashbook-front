import { CATEGORY_LABELS, type Category } from '../../lib/categories'
import { formatDate, formatSignedCurrency } from '../../lib/format'
import { useChartTheme } from '../../lib/chartTheme'

export interface TransactionRow {
  id: number
  description: string
  amount: number
  category: Category
  createdAt: Date
}

// The table is the accessible twin of both charts: every value the charts show
// is readable here without color or hover.
export default function TransactionsTable({ rows }: { rows: TransactionRow[] }) {
  const { colors } = useChartTheme()

  if (rows.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
        No transactions in this period.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs font-medium uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <th scope="col" className="px-6 py-3 font-medium">
              Date
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Description
            </th>
            <th scope="col" className="px-6 py-3 font-medium">
              Category
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-neutral-100 transition last:border-0 hover:bg-neutral-50 dark:border-neutral-800/60 dark:hover:bg-neutral-800/40"
            >
              <td className="whitespace-nowrap px-6 py-3 text-neutral-500 dark:text-neutral-400">
                {formatDate(row.createdAt)}
              </td>
              <td className="max-w-[40ch] truncate px-6 py-3 text-neutral-900 dark:text-neutral-100">
                {row.description}
              </td>
              <td className="whitespace-nowrap px-6 py-3">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colors[row.category] }}
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">{CATEGORY_LABELS[row.category]}</span>
                </span>
              </td>
              <td
                className={`whitespace-nowrap px-6 py-3 text-right tabular-nums ${
                  row.amount > 0
                    ? 'font-medium text-[#006300] dark:text-[#0ca30c]'
                    : 'text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {formatSignedCurrency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
