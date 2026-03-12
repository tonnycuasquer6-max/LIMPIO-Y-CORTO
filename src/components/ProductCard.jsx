import { useState } from 'react';
import { useCart } from '../contexts/CartContext';

export default function ProductCard({ producto, userRole, prepararEdicion, handleBorrarLocal, setProductoSeleccionado }) {
  const { favoritos, toggleFavorito, agregarAlCarrito } = useCart();
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState([]);

  const isRing = producto.subcategoria === 'Anillos';
  const canBuy = !isRing || tallasSeleccionadas.length > 0;

  const handleSelectTalla = (e, talla) => {
    e.stopPropagation();
    setTallasSeleccionadas(prev => 
      prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]
    );
  };

  const onComprar = (e) => {
    e.stopPropagation();
    if (canBuy) {
      agregarAlCarrito(producto, tallasSeleccionadas);
      setTallasSeleccionadas([]); // Limpiar selección tras comprar
    }
  };

  return (
    <div className="group relative bg-transparent rounded-sm flex flex-col p-0 w-full">
      <div 
        className={`overflow-hidden aspect-square relative w-full ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} 
        onClick={() => { if(userRole === 'cliente') setProductoSeleccionado(producto); }}
      >
        <img src={producto.imagen_url} alt={producto.titulo} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all duration-700" />
        
        {/* Controles de Admin */}
        {userRole === 'admin' && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} className="bg-black/80 p-2 text-white rounded-full">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 p-2 text-white rounded-full text-red-500">🗑️</button>
          </div>
        )}
      </div>
      
      <div className="bg-black/40 backdrop-blur-xl rounded-b-sm p-4 flex flex-col flex-grow items-center text-center w-full">
        <h4 className="text-[10px] md:text-sm tracking-[0.2em] uppercase text-white mb-2">{producto.titulo}</h4>
        <span className="text-[10px] md:text-sm tracking-[0.1em] text-white font-light mb-1">${producto.precio} USD</span>
        
        {/* Lógica condicional de UI según rol omitida por brevedad, pero usarías las funciones onComprar y toggleFavorito aquí */}
        {userRole === 'cliente' && !producto.vendido && (
            <div className="flex gap-2 mt-auto w-full z-30 justify-center">
               <button onClick={onComprar} className={`w-full py-2 text-[8px] font-bold uppercase transition-colors ${canBuy ? 'bg-white text-black' : 'bg-white/20 text-gray-400'}`}>
                 {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
               </button>
               <button onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} className="px-4 border border-white/20 text-white text-xs">
                 {favoritos.includes(producto.id) ? 'Quitar' : 'Guardar'}
               </button>
            </div>
        )}
      </div>
    </div>
  );
}