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
      setTallasSeleccionadas([]);
    }
  };

  // Procesamos las tallas de forma segura
  const tallasObj = typeof producto.tallas === 'string' ? JSON.parse(producto.tallas || '{}') : (producto.tallas || {});
  const tallasDisponibles = ['6', '7', '8', '9', '10', '11', '12'];

  return (
    <div className="group relative bg-transparent rounded-sm flex flex-col p-0 w-full font-['Times_New_Roman',_Times,_serif]">
      <div 
        className={`overflow-hidden aspect-square relative w-full ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} 
        onClick={() => { if(userRole === 'cliente') setProductoSeleccionado(producto); }}
      >
        <img src={producto.imagen_url} alt={producto.titulo} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all duration-700" />
        
        {userRole === 'admin' && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} className="bg-black/80 p-2 text-white rounded-full">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 p-2 text-white rounded-full text-red-500">🗑️</button>
          </div>
        )}
      </div>
      
      <div className="bg-black/40 backdrop-blur-xl rounded-b-sm p-4 flex flex-col flex-grow items-center text-center w-full">
        {/* TITULO EN 13 PUNTOS */}
        <h4 className="text-[13px] tracking-[0.2em] uppercase text-white mb-2">{producto.titulo}</h4>
        <span className="text-[13px] tracking-[0.1em] text-white font-light mb-4">${producto.precio} USD</span>
        
        {isRing && (
          <div className="flex flex-wrap justify-center gap-2 mb-4 w-full">
            {tallasDisponibles.map(talla => {
              const stock = parseInt(tallasObj[talla] || 0);
              const isAvailable = stock > 0;
              const isSelected = tallasSeleccionadas.includes(talla);
              
              return (
                <div key={talla} className="flex flex-col items-center gap-1">
                  <button 
                    type="button"
                    onClick={(e) => { if (isAvailable) handleSelectTalla(e, talla); }}
                    // TALLAS A 12 PUNTOS CON 2PX DE PADDING ALREDEDOR (p-[2px] y min-w-[24px] para que no se deformen)
                    className={`min-w-[24px] flex items-center justify-center p-[2px] text-[12px] tracking-[0.1em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-white border-white/30 hover:border-white') : 'border-red-500/20 text-red-500 cursor-not-allowed opacity-50'}`}
                  >
                    {talla}
                  </button>
                  <span className={`text-[10px] tracking-[0.1em] uppercase leading-none ${isAvailable ? 'text-gray-400' : 'text-red-500/70'}`}>
                    {stock}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {userRole === 'cliente' && !producto.vendido && (
            <div className="flex gap-2 mt-auto w-full z-30 justify-center">
               <button onClick={onComprar} className={`w-full py-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors border ${canBuy ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600'}`}>
                 {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
               </button>
            </div>
        )}
      </div>
    </div>
  );
}