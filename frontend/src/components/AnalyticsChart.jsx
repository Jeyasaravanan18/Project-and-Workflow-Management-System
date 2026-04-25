import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const AnalyticsChart = ({ data, type = 'bar', dataKey, categoryKey = 'name', color = '#0f62fe', colors }) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4', border: '1px dashed #e0e0e0' }}>
                <span style={{ color: '#525252', fontSize: '0.875rem' }}>No data available for this range</span>
            </div>
        );
    }

    // IBM Carbon Data Viz Palette
    const carbonPalette = colors || ['#0f62fe', '#8a3ffc', '#007d79', '#ff7eb6', '#fa4d56', '#6f6f6f'];

    // Pie chart rendering
    if (type === 'pie') {
        return (
            <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey={dataKey}
                            nameKey={categoryKey}
                            labelLine={false}
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={carbonPalette[index % carbonPalette.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#161616', border: 'none', borderRadius: '0', color: '#ffffff', fontSize: '0.75rem' }}
                            itemStyle={{ color: '#ffffff' }}
                            cursor={{ fill: '#f4f4f4', opacity: 0.1 }}
                        />
                        <Legend verticalAlign="bottom" iconType="rect" iconSize={10} wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // Bar/Line chart rendering
    const ChartComponent = type === 'line' ? LineChart : BarChart;

    return (
        <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <ChartComponent data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" stroke="#e0e0e0" vertical={false} />
                    <XAxis
                        dataKey={categoryKey}
                        stroke="#8d8d8d"
                        tick={{ fill: '#525252', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis
                        stroke="#8d8d8d"
                        tick={{ fill: '#525252', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#161616', border: 'none', borderRadius: '0', color: '#ffffff', fontSize: '0.75rem' }}
                        cursor={{ fill: '#f4f4f4' }}
                    />
                    {type === 'bar' ? (
                        <Bar dataKey={dataKey} fill={color} radius={0} barSize={32} />
                    ) : (
                        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    )}
                </ChartComponent>
            </ResponsiveContainer>
        </div>
    );
};

export default AnalyticsChart;

