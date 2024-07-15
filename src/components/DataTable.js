import React, { useState, useMemo } from 'react';
import { useTable, useSortBy, usePagination, useFilters, useGlobalFilter, useGroupBy, useColumnOrder } from 'react-table';
import { format } from 'date-fns';
import Select from 'react-select';
import data from '../data.json';
import './DataTable.css'; // Importing the CSS file

const DataTable = () => {
  const [filterInput, setFilterInput] = useState('');

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Filter: DefaultColumnFilter,
        filter: 'fuzzyText',
      },
      {
        Header: 'Category',
        accessor: 'category',
        Filter: SelectColumnFilter,
        filter: 'includes',
      },
      {
        Header: 'Subcategory',
        accessor: 'subcategory',
        Filter: SelectColumnFilter,
        filter: 'includes',
      },
      {
        Header: 'Price',
        accessor: 'price',
        Filter: SliderColumnFilter,
        filter: 'between',
      },
      {
        Header: 'Created At',
        accessor: 'createdAt',
        Cell: ({ value }) => format(new Date(value), 'dd-MMM-yyyy HH:mm'),
        Filter: DateRangeColumnFilter,
        filter: 'dateBetween',
      },
      {
        Header: 'Updated At',
        accessor: 'updatedAt',
        Cell: ({ value }) => format(new Date(value), 'dd-MMM-yyyy HH:mm'),
      },
    ],
    []
  );

  const tableData = useMemo(() => data, []);

  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  );

  const tableInstance = useTable(
    {
      columns,
      data: tableData,
      defaultColumn,
      initialState: { pageIndex: 0 },
      filterTypes: {
        fuzzyText: fuzzyTextFilterFn,
        includes: (rows, id, filterValue) => {
          return rows.filter((row) => {
            const rowValue = row.values[id];
            return rowValue && rowValue.includes(filterValue);
          });
        },
        between: (rows, id, filterValue) => {
          return rows.filter((row) => {
            const rowValue = row.values[id];
            return rowValue >= filterValue[0] && rowValue <= filterValue[1];
          });
        },
        dateBetween: (rows, id, filterValue) => {
          return rows.filter((row) => {
            const rowValue = new Date(row.values[id]);
            return rowValue >= filterValue[0] && rowValue <= filterValue[1];
          });
        },
      },
    },
    useFilters,
    useGlobalFilter,
    useColumnOrder,
    useGroupBy,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    state: { pageIndex, pageSize },
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    setGlobalFilter,
    setPageSize,
    pageCount,
    visibleColumns,
    allColumns,
    getToggleHideAllColumnsProps,
  } = tableInstance;

  const handleFilterChange = (e) => {
    const value = e.target.value || undefined;
    setGlobalFilter(value);
    setFilterInput(value);
  };

  return (
    <div className="table-container">
      <div className="search-bar">
        <input
          value={filterInput}
          onChange={handleFilterChange}
          placeholder="Search name"
        />
      </div>
      <div className="toggle-columns">
        <div>
          <input type="checkbox" {...getToggleHideAllColumnsProps()} /> Toggle All
        </div>
        {allColumns.map((column) => (
          <div key={column.id}>
            <label>
              <input type="checkbox" {...column.getToggleHiddenProps()} /> {column.Header}
            </label>
          </div>
        ))}
      </div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </span>
                  <div>{column.canFilter ? column.render('Filter') : null}</div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pagination-controls">
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          Previous
        </button>
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          Next
        </button>
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageCount}
          </strong>{' '}
        </span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const SelectColumnFilter = ({ column: { filterValue, setFilter, preFilteredRows, id } }) => {
  const options = useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach((row) => options.add(row.values[id]));
    return [...options.values()];
  }, [id, preFilteredRows]);

  return (
    <Select
      value={filterValue}
      onChange={(value) => setFilter(value ? value.value : undefined)}
      options={options.map((option) => ({
        value: option,
        label: option,
      }))}
    />
  );
};

const SliderColumnFilter = ({ column: { filterValue = [], setFilter, preFilteredRows, id } }) => {
  const [min, max] = useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0;
    preFilteredRows.forEach((row) => {
      min = Math.min(row.values[id], min);
      max = Math.max(row.values[id], max);
    });
    return [min, max];
  }, [id, preFilteredRows]);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="number"
        value={filterValue[0] || ''}
        onChange={(e) => {
          const val = e.target.value;
          setFilter((old = []) => [val ? Number(val) : undefined, old[1]]);
        }}
        placeholder={`Min (${min})`}
        style={{ marginRight: '0.5rem', width: '70px' }}
      />
      <input
        type="number"
        value={filterValue[1] || ''}
        onChange={(e) => {
          const val = e.target.value;
          setFilter((old = []) => [old[0], val ? Number(val) : undefined]);
        }}
        placeholder={`Max (${max})`}
        style={{ width: '70px' }}
      />
    </div>
  );
};


const DateRangeColumnFilter = ({ column: { filterValue = [], setFilter, preFilteredRows, id } }) => {
  const [min, max] = useMemo(() => {
    let min = preFilteredRows.length ? new Date(preFilteredRows[0].values[id]) : new Date(0);
    let max = preFilteredRows.length ? new Date(preFilteredRows[0].values[id]) : new Date(0);
    preFilteredRows.forEach((row) => {
      min = new Date(Math.min(new Date(row.values[id]), min));
      max = new Date(Math.max(new Date(row.values[id]), max));
    });
    return [min, max];
  }, [id, preFilteredRows]);

  return (
    <div>
      <input
        type="date"
        value={filterValue[0] ? format(new Date(filterValue[0]), 'yyyy-MM-dd') : ''}
        onChange={(e) => {
          const val = e.target.value;
          setFilter((old = []) => [val ? new Date(val) : undefined, old[1]]);
        }}
      />
      <input
        type="date"
        value={filterValue[1] ? format(new Date(filterValue[1]), 'yyyy-MM-dd') : ''}
        onChange={(e) => {
          const val = e.target.value;
          setFilter((old = []) => [old[0], val ? new Date(val) : undefined]);
        }}
      />
      <div>
        Min: {filterValue[0] ? format(new Date(filterValue[0]), 'dd-MMM-yyyy') : 'yyyy-MM-dd'} Max:{' '}
        {filterValue[1] ? format(new Date(filterValue[1]), 'dd-MMM-yyyy') : 'yyyy-MM-dd'}
      </div>
    </div>
  );
};

const DefaultColumnFilter = ({ column: { filterValue, preFilteredRows, setFilter } }) => (
  <input
    value={filterValue || ''}
    onChange={(e) => setFilter(e.target.value || undefined)}
    placeholder={`Search ${preFilteredRows.length} records...`}
  />
);

const fuzzyTextFilterFn = (rows, id, filterValue) => {
  return rows.filter((row) => {
    const rowValue = row.values[id];
    return rowValue.toLowerCase().includes(filterValue.toLowerCase());
  });
};

export default DataTable;
