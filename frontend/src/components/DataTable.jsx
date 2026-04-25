import { useState } from 'prop-types';
import PropTypes from 'prop-types';
import { ChevronUp, ChevronDown } from 'lucide-react';

const DataTable = ({
    columns,
    data,
    sortable = true,
    hoverable = true,
    striped = false,
    className = ''
}) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleSort = (key) => {
        if (!sortable) return;

        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-700 text-left">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`p-4 text-sm font-medium text-slate-400 ${sortable && col.sortable !== false ? 'cursor-pointer hover:text-slate-200' : ''
                                    }`}
                                onClick={() => col.sortable !== false && handleSort(col.key)}
                            >
                                <div className="flex items-center gap-2">
                                    {col.header}
                                    {sortable && col.sortable !== false && sortConfig.key === col.key && (
                                        sortConfig.direction === 'asc' ?
                                            <ChevronUp size={16} /> :
                                            <ChevronDown size={16} />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, idx) => (
                        <tr
                            key={row.id || idx}
                            className={`
                                border-b border-slate-700/50 transition-colors
                                ${hoverable ? 'hover:bg-slate-700/30' : ''}
                                ${striped && idx % 2 === 1 ? 'bg-slate-800/30' : ''}
                            `}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className="p-4">
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

DataTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        header: PropTypes.string.isRequired,
        sortable: PropTypes.bool,
        render: PropTypes.func
    })).isRequired,
    data: PropTypes.array.isRequired,
    sortable: PropTypes.bool,
    hoverable: PropTypes.bool,
    striped: PropTypes.bool,
    className: PropTypes.string
};

export default DataTable;
