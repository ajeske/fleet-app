/* OneNote-style sidebar
Key OneNote patterns:

Fixed left rail (~260px), light gray background
Expand/collapse chevrons on categories
Purple accent on the selected subcategory
Indented subcategories under each category */

// src/components/Sidebar.jsx
import { useState } from 'react'

export default function Sidebar({ categories, selectedSubcategoryId, onSelectSubcategory }) {
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(categories.map((c) => [c.id, true]))
  )

  const toggle = (categoryId) => {
    setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-sm font-semibold text-slate-800">Fleet Manager</h1>
        <p className="text-xs text-slate-500">Vehicle categories</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {categories.map((category) => {
          const isOpen = expanded[category.id]

          return (
            <div key={category.id} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(category.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <span className="text-xs text-slate-400">{isOpen ? '▾' : '▸'}</span>
                {category.name}
              </button>

              {isOpen && (
                <ul className="ml-5 mt-1 space-y-0.5 border-l border-slate-200 pl-2">
                  {category.subcategories.map((sub) => {
                    const selected = selectedSubcategoryId === sub.id

                    return (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => onSelectSubcategory(sub.id)}
                          className={[
                            'w-full rounded-md px-2 py-1.5 text-left text-sm transition',
                            selected
                              ? 'bg-purple-100 font-medium text-purple-900'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900',
                          ].join(' ')}
                        >
                          {sub.name}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}