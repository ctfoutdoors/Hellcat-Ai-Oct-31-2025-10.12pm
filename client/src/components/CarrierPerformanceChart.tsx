import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CarrierPerformanceChartProps {
  data: Array<{
    carrier: string;
    totalCases: number;
    resolved: number;
    rejected: number;
    pending: number;
    totalClaimed: number;
    totalRecovered: number;
    successRate: number;
  }>;
}

export function CarrierPerformanceChart({ data }: CarrierPerformanceChartProps) {
  const chartData = data.map((item) => ({
    name: item.carrier,
    'Total Cases': item.totalCases,
    'Resolved': item.resolved,
    'Rejected': item.rejected,
    'Pending': item.pending,
    'Success Rate': item.successRate,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const carrierData = data.find((d) => d.carrier === label);
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">Total Cases: {carrierData?.totalCases}</p>
            <p className="text-green-600">Resolved: {carrierData?.resolved}</p>
            <p className="text-red-600">Rejected: {carrierData?.rejected}</p>
            <p className="text-yellow-600">Pending: {carrierData?.pending}</p>
            <p className="text-blue-600">
              Success Rate: {carrierData?.successRate.toFixed(1)}%
            </p>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-gray-700">
                Claimed: ${carrierData?.totalClaimed.toFixed(2)}
              </p>
              <p className="text-green-600">
                Recovered: ${carrierData?.totalRecovered.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <p>No carrier data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="Resolved" fill="#10B981" />
          <Bar dataKey="Rejected" fill="#EF4444" />
          <Bar dataKey="Pending" fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
