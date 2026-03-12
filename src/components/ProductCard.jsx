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
    // Borde a la derecha y abajo para formar la cuadrícula. 
    <div className="group relative bg-transparent flex flex-col p-6 w-full border-r border-b border-white/20 font-['Times_New_Roman',_Times,_serif]">
      
      {/* LA ESTRELLA ✦ (Posicionada exactamente en la intersección de las líneas) */}
      <span className="absolute -bottom-[10px] -right-[7px] text-[16px] text-white z-50 leading-none bg-black px-1">✦</span>

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
        
        {/* DESCRIPCIÓN: Forzada a blanco puro con style para que NADA la ponga gris */}
        <p style={{ color: 'white' }} className="text-[12px] line-clamp-2 leading-relaxed mb-6 uppercase w-full">
          {producto.descripcion}
        </p>

        {userRole === 'cliente' && !producto.vendido && (
            <div className="flex gap-2 mt-auto w-full justify-center z-30">
               <button onClick={onComprar} className={`w-full py-2 text-[10px] tracking-[0.2em] font-bold uppercase transition-colors border outline-none ${canBuy ? 'bg-transparent text-white border-white hover:bg-white hover:text-black' : 'bg-transparent text-gray-500 border-gray-600 cursor-not-allowed'}`}>
                 {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
               </button>
            </div>
        )}
      </div>
    </div>
  );
}