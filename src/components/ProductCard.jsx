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

  const tallasObj = typeof producto.tallas === 'string' ? JSON.parse(producto.tallas || '{}') : (producto.tallas || {});
  const tallasDisponibles = ['6', '7', '8', '9', '10', '11', '12'];

  return (
    // Bordes a la derecha y abajo para formar la cuadrícula con el gap-0 de App.tsx
    <div className="group relative bg-transparent flex flex-col p-6 w-full border-r border-b border-white/20 font-['Times_New_Roman',_Times,_serif]">
      
      {/* Estrella en la intersección (fondo negro para tapar el cruce de líneas) */}
      <span className="absolute -bottom-[9px] -right-[9px] text-[16px] text-white/50 leading-none z-10 bg-black px-[2px]">✦</span>

      <div 
        className={`overflow-hidden aspect-square relative w-full mb-6 flex items-center justify-center ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} 
        onClick={() => { if(userRole === 'cliente') setProductoSeleccionado(producto); }}
      >
        <img src={producto.imagen_url} alt={producto.titulo} loading="lazy" className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-all duration-700" />
        
        {userRole === 'admin' && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} className="bg-black/80 p-2 text-white rounded-full">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 p-2 text-white rounded-full text-red-500">🗑️</button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow items-center text-center w-full">
        {/* TITULO EN 13 PUNTOS */}
        <h4 className="text-[13px] tracking-[0.2em] uppercase text-white mb-2">{producto.titulo}</h4>
        <span className="text-[13px] tracking-[0.1em] text-white font-light mb-6">${producto.precio} USD</span>
        
        {isRing && (
          <div className="flex flex-wrap justify-center gap-2 mb-6 w-full">
            {tallasDisponibles.map(talla => {
              const stock = parseInt(tallasObj[talla] || 0);
              const isAvailable = stock > 0;
              const isSelected = tallasSeleccionadas.includes(talla);
              
              return (
                <div key={talla} className="flex flex-col items-center gap-1">
                  <button 
                    type="button"
                    onClick={(e) => { if (isAvailable) handleSelectTalla(e, talla); }}
                    // TALLAS A 12 PUNTOS CON 2PX DE PADDING ALREDEDOR
                    className={`min-w-[24px] h-[24px] flex items-center justify-center p-[2px] text-[12px] tracking-[0.1em] transition-all duration-300 border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-white border-white/30 hover:border-white') : 'border-red-500/30 text-red-500 cursor-not-allowed opacity-50'}`}
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
        
        {/* DESCRIPCION EN 12 PUNTOS Y BLANCO PURO */}
        <p className="text-[12px] text-[#ffffff] line-clamp-2 leading-relaxed mb-6 uppercase w-full opacity-100">
          {producto.descripcion}
        </p>

        {userRole === 'cliente' && !producto.vendido && (
            <div className="flex gap-2 mt-auto w-full justify-center z-30">
               <button onClick={onComprar} className={`w-full py-2 text-[10px] tracking-[0.2em] font-bold uppercase transition-colors border ${canBuy ? 'bg-white text-black border-white hover:bg-gray-300' : 'bg-transparent text-gray-500 border-gray-600 cursor-not-allowed'}`}>
                 {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
               </button>
            </div>
        )}
      </div>
    </div>
  );
}