const fs = require('fs');
let code = fs.readFileSync('app/dashboard/page.jsx', 'utf8');

// 1. Remove Recharts import
code = code.replace("import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';", "");

// 2. Locate the chart block and replace it
const oldChartStart = '<div className="h-[320px] w-full overflow-x-auto hide-scrollbar">';
const oldChartEnd = '</div>          </div>';

const startIndex = code.indexOf(oldChartStart);
const endIndex = code.indexOf(oldChartEnd, startIndex) + oldChartEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newChartCode = `
              <div className="w-full mt-4 space-y-6">
                {(() => {
                   if (!graphData || graphData.length === 0) return <div className="text-sm text-slate-500">No data available</div>;
                   const maxCount = Math.max(...graphData.map(d => d.count)) || 1;
                   return graphData.map((item, i) => (
                     <div key={i} className="w-full group">
                        <div className="flex justify-between items-end mb-2">
                           <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 group-hover:text-[#1E3A8A] dark:group-hover:text-blue-400 transition-colors">
                             {item.rule_id}
                           </span>
                           <span className="text-[12px] font-bold text-slate-900 dark:text-white">
                             {item.count} <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">scans</span>
                           </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2.5 overflow-hidden flex">
                           <div 
                             className="h-full bg-gradient-to-r from-[#1E3A8A] to-blue-500 dark:from-blue-600 dark:to-blue-400 rounded-full transition-all duration-1000 ease-out" 
                             style={{ width: \`\${(item.count / maxCount) * 100}%\` }}
                           ></div>
                        </div>
                     </div>
                   ));
                })()}
              </div>
            </div>`;
  
  code = code.substring(0, startIndex) + newChartCode + code.substring(endIndex);
  fs.writeFileSync('app/dashboard/page.jsx', code);
  console.log("DASHBOARD CHART UPGRADED");
} else {
  console.log("COULD NOT FIND CHART BLOCK");
}
