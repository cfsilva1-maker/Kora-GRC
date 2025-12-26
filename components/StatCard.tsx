import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  isWarning?: boolean;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  isWarning = false,
  className = ''
}) => {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <p className={`text-xs font-medium ${isWarning ? 'text-red-500' : 'text-emerald-600'}`}>
        {trend}
      </p>
    </div>
  );
};

export default StatCard;