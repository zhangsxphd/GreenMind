export default function SensorMetric({ icon: Icon, label, value, isWarning = false }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className={isWarning ? 'text-rose-500' : 'text-slate-400'} />
      <div>
        <p className="text-[10px] uppercase text-slate-500">{label}</p>
        <p className={`text-sm font-semibold ${isWarning ? 'text-rose-600' : 'text-slate-700'}`}>{value}</p>
      </div>
    </div>
  );
}
