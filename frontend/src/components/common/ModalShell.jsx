import { X } from 'lucide-react';

export default function ModalShell({ title, description, children, footer, onClose, size = 'max-w-4xl' }) {
  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full ${size} max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <div className="border-t border-slate-100 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
