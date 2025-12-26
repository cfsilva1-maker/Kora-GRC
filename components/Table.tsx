import React from 'react';

interface TableColumn {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string;
  emptyMessage?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  className = '',
  headerClassName = 'bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200',
  bodyClassName = 'divide-y divide-slate-100',
  rowClassName = 'hover:bg-slate-50',
  emptyMessage = 'No data available'
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-sm">
        <thead className={headerClassName}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`px-6 py-4 ${column.className || ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index} className={rowClassName}>
                {columns.map((column) => (
                  <td key={column.key} className={`px-6 py-4 ${column.className || ''}`}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;