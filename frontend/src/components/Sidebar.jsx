export default function Sidebar({ statuses, selectedStatus, onSelectStatus }) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-sm font-semibold text-slate-800">Fleet Manager</h1>
        <p className="text-xs text-slate-500">Cars by status</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {statuses.map((status) => {
            const selected = selectedStatus === status

            return (
              <li key={status}>
                <button
                  type="button"
                  onClick={() => onSelectStatus(status)}
                  className={[
                    'w-full rounded-md px-3 py-2 text-left text-sm transition',
                    selected
                      ? 'bg-purple-100 font-medium text-purple-900'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900',
                  ].join(' ')}
                >
                  {status}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
