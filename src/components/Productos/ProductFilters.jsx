import React from 'react';

export default function ProductFilters({ filters, setFilters, categorias }) {
  const handleClear = () => {
    setFilters({ search: '', categoria: '', estado: '' });
  };

  return (
    <div className="modern-filters-card">
      <div className="modern-filters-header">
        <div className="modern-filters-icon">🔍</div>
        <h3>Buscar / Filtrar Productos</h3>
      </div>

      <div className="modern-filters-body">
        <div className="modern-form-group">
          <label>Buscar por nombre o código</label>
          <div className="modern-input-wrapper">
            <span className="input-icon">🔎</span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Ej. VID-001 o 'templado'"
            />
          </div>
        </div>

        <div className="modern-form-group">
          <label>Categoría</label>
          <div className="modern-input-wrapper">
            <span className="input-icon">📂</span>
            <select
              value={filters.categoria}
              onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="modern-form-group">
          <label>Estado</label>
          <div className="modern-input-wrapper">
            <span className="input-icon">⚡</span>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <button onClick={handleClear} className="btn-modern-clear">
          🧹 Limpiar filtros
        </button>
      </div>
    </div>
  );
}