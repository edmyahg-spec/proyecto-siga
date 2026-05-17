import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import ProductFilters from './ProductFilters';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    categoria: '',
    estado: ''
  });

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await api.get('/productos/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editProduct) {
        await api.put(`/productos/${editProduct.id}`, productData);
        toast.success('Producto actualizado correctamente');
      } else {
        await api.post('/productos', productData);
        toast.success('Producto creado correctamente');
      }
      setEditProduct(null);
      await cargarProductos();
      await cargarCategorias();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.error || 'Error al guardar producto');
      throw error;
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await api.delete(`/productos/${id}`);
        toast.success('Producto eliminado correctamente');
        await cargarProductos();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error al eliminar producto');
      }
    }
  };

  const filteredProductos = productos.filter(producto => {
    const matchSearch = !filters.search || 
      producto.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(filters.search.toLowerCase());
    const matchCategoria = !filters.categoria || producto.categoria === filters.categoria;
    const matchEstado = !filters.estado || producto.estado === filters.estado;
    return matchSearch && matchCategoria && matchEstado;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6b4f3a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#3b2b1f]">Gestión de Productos</h1>
        <p className="text-gray-500 text-sm mt-1">Administre el catálogo de productos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductForm 
          categorias={categorias}
          editProduct={editProduct}
          onSave={handleSaveProduct}
          onCancel={() => setEditProduct(null)}
        />
        
        <ProductFilters 
          filters={filters}
          setFilters={setFilters}
          categorias={categorias}
        />
      </div>

      <ProductList 
        productos={filteredProductos}
        onEdit={setEditProduct}
        onDelete={handleDeleteProduct}
      />
    </div>
  );
}