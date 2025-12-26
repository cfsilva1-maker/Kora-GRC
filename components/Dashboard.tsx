import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, ShieldCheck, Users, Activity } from 'lucide-react';
import { Vendor, RiskLevel } from '../types';
import StatCard from './StatCard';

interface DashboardProps {
  vendors: Vendor[];
}

const COLORS = {
  [RiskLevel.CRITICAL]: '#EF4444', // Red 500
  [RiskLevel.HIGH]: '#F97316',     // Orange 500
  [RiskLevel.MEDIUM]: '#EAB308',   // Yellow 500
  [RiskLevel.LOW]: '#22C55E',      // Green 500
};

const Dashboard: React.FC<DashboardProps> = ({ vendors }) => {
  // Compute stats
  const riskCounts = vendors.reduce((acc, v) => {
    acc[v.riskLevel] = (acc[v.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(riskCounts).map(key => ({
    name: key,
    value: riskCounts[key],
  }));

  const trendData = [
    { name: 'Jan', critical: 1, high: 2, medium: 5 },
    { name: 'Feb', critical: 0, high: 3, medium: 6 },
    { name: 'Mar', critical: 2, high: 2, medium: 8 },
    { name: 'Apr', critical: 1, high: 4, medium: 10 },
    { name: 'May', critical: 1, high: 3, medium: 12 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Vendors" 
          value={vendors.length.toString()} 
          icon={<Users className="w-6 h-6 text-blue-600" />} 
          trend="+12% from last month"
        />
        <StatCard 
          title="Critical Risks" 
          value={riskCounts[RiskLevel.CRITICAL]?.toString() || '0'} 
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />} 
          trend="Requires attention"
          isWarning
        />
        <StatCard 
          title="Completed Assessments" 
          value="84%" 
          icon={<ShieldCheck className="w-6 h-6 text-green-600" />} 
          trend="+5% completion rate"
        />
        <StatCard 
          title="Avg Risk Score" 
          value="42/100" 
          icon={<Activity className="w-6 h-6 text-indigo-600" />} 
          trend="Stable"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        {/* Risk Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Risk Distribution</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as RiskLevel]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {Object.entries(COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Risk Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Risk Trend (6 Months)</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#F97316" fill="#F97316" fillOpacity={0.2} />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;