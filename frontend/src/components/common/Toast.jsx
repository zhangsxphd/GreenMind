export default function Toast({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-4 fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-slate-800/90 px-6 py-3 font-medium text-white shadow-lg backdrop-blur duration-300">
      {message}
    </div>
  );
}
