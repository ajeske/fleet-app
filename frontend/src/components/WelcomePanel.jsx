export default function WelcomePanel({ onAddVehicle }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Welcome to Fleet Manager</h2>
        <p className="mt-2 text-sm text-slate-500">
          Choose a status on the left to view cars, or add a new vehicle to get started.
        </p>

        <button
          type="button"
          onClick={onAddVehicle}
          className="mt-8 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-purple-700 text-white shadow-md transition hover:bg-purple-800 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-200"
          aria-label="Add vehicle"
        >
          <span className="text-3xl leading-none">+</span>
          <span className="mt-1 text-xs font-medium">Add vehicle</span>
        </button>

        <p className="mt-6 text-xs text-slate-400">
          New vehicles are added under Active unless you pick another status first.
        </p>
      </div>
    </main>
  )
}
