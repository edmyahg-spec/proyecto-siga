// funciones.js
function onProductoChange(){
  const sel = document.getElementById('productoSelect');
  if(!sel) return;
  const opt = sel.options[sel.selectedIndex];
  const price = opt.getAttribute('data-price');
  const stock = opt.getAttribute('data-stock');
  const priceInput = document.getElementById('ventaPrecio');
  const qtyInput = document.getElementById('ventaCantidad');
  if(priceInput && price) priceInput.value = parseFloat(price).toFixed(2);
  if(qtyInput && stock) qtyInput.max = stock;
}
document.addEventListener('DOMContentLoaded', ()=>{ onProductoChange(); });
