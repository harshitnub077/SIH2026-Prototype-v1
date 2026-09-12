const fs = require('fs');
let code = fs.readFileSync('app/dashboard/page.jsx', 'utf8');

const chartStart = code.indexOf('<div className="h-[320px] w-full">');
const chartEnd = code.indexOf('</ResponsiveContainer>') + '</ResponsiveContainer>'.length + 20;

const before = code.substring(0, chartStart);
const after = code.substring(chartEnd);

const newChart = `<div className="h-[320px] w-full overflow-x-auto hide-scrollbar">
              <div className="min-w-[500px] h-full pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis 
                      dataKey="rule_id" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
                      dy={12} 
                      interval={0} 
                      tickFormatter={(val) => val.replace(/Rule /g, 'R')}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={40} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(30,58,138,0.04)' }} 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.95)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        color: '#0f172a',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontWeight: 600,
                        fontSize: '14px'
                      }} 
                      itemStyle={{ color: '#1E3A8A' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                      {graphData.map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={index === 0 ? '#1E3A8A' : '#94a3b8'} className="dark:opacity-90 hover:opacity-80 transition-opacity" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>`;

fs.writeFileSync('app/dashboard/page.jsx', before + newChart + after);
console.log("CHART FIXED");
