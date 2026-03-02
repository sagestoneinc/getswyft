import { useState } from "react";
import { BarChart3, TrendingUp, Clock, MessageCircle, Users, Phone, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const kpis = [
  { label: "Total Conversations", value: "1,247", change: "+12%", icon: MessageCircle, color: "bg-blue-50 text-blue-600" },
  { label: "Avg Response Time", value: "28s", change: "-15%", icon: Clock, color: "bg-green-50 text-green-600" },
  { label: "Lead Conversion", value: "47%", change: "+8%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  { label: "Active Agents", value: "12", change: "+2", icon: Users, color: "bg-amber-50 text-amber-600" },
];

const volumeData = [
  { day: "Mon", conversations: 45, calls: 12 },
  { day: "Tue", conversations: 62, calls: 18 },
  { day: "Wed", conversations: 58, calls: 15 },
  { day: "Thu", conversations: 71, calls: 22 },
  { day: "Fri", conversations: 89, calls: 28 },
  { day: "Sat", conversations: 34, calls: 8 },
  { day: "Sun", conversations: 21, calls: 5 },
];

const responseData = [
  { hour: "8am", time: 35 },
  { hour: "9am", time: 22 },
  { hour: "10am", time: 18 },
  { hour: "11am", time: 15 },
  { hour: "12pm", time: 28 },
  { hour: "1pm", time: 20 },
  { hour: "2pm", time: 16 },
  { hour: "3pm", time: 19 },
  { hour: "4pm", time: 25 },
  { hour: "5pm", time: 32 },
];

const sourceData = [
  { name: "Website", value: 45, color: "#1e3a5f" },
  { name: "Zillow", value: 25, color: "#14b8a6" },
  { name: "Realtor.com", value: 18, color: "#0ea5e9" },
  { name: "Facebook", value: 12, color: "#8b5cf6" },
];

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-primary" style={{ fontWeight: 700 }}>Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Track performance and lead engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded" style={{ fontWeight: 600 }}>
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl text-primary" style={{ fontWeight: 700 }}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Conversation Volume */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-primary mb-4" style={{ fontWeight: 600 }}>Conversation Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="conversations" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="calls" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded bg-primary"></span> Chats
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded bg-accent"></span> Calls
            </span>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-primary mb-4" style={{ fontWeight: 600 }}>Avg Response Time (seconds)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={responseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="time" stroke="#14b8a6" strokeWidth={2} dot={{ fill: "#14b8a6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-primary mb-4" style={{ fontWeight: 600 }}>Lead Sources</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {sourceData.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: s.color }}></span>
                    <span className="text-sm text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="text-sm text-primary" style={{ fontWeight: 600 }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Leaderboard */}
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-primary mb-4" style={{ fontWeight: 600 }}>Agent Leaderboard</h3>
          <div className="space-y-3">
            {[
              { name: "Emily Rodriguez", conversations: 89, avgResponse: "12s", conversion: "52%" },
              { name: "Sarah Chen", conversations: 72, avgResponse: "18s", conversion: "48%" },
              { name: "Marcus Johnson", conversations: 65, avgResponse: "22s", conversion: "45%" },
              { name: "Lisa Patel", conversations: 41, avgResponse: "25s", conversion: "42%" },
            ].map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-accent w-6 text-center" style={{ fontWeight: 700 }}>#{i + 1}</span>
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-xs text-accent" style={{ fontWeight: 600 }}>
                  {agent.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate" style={{ fontWeight: 500 }}>{agent.name}</p>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{agent.conversations} chats</span>
                  <span className="hidden sm:inline">{agent.avgResponse} avg</span>
                  <span className="text-accent" style={{ fontWeight: 600 }}>{agent.conversion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
