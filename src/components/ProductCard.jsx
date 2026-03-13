import { useState, useEffect, useRef } from 'react';
import { useCart } from '../contexts/CartContext';

export default function ProductCard({ producto, userRole, prepararEdicion, handleBorrarLocal, setProductoSeleccionado }) {
  const { favoritos, toggleFavorito, agregarAlCarrito } = useCart();
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState([]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef(null);

  const isRing = producto.subcategoria === 'Anillos';
  const canBuy = !isRing || tallasSeleccionadas.length > 0;

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImgLoaded(true);
    }
  }, []);

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
    <div className="group relative bg-black flex flex-col p-6 w-full border-r border-b border-[#333333] font-serif">
      
      {/* Estrella en la intersección: Color sólido para que destaque sobre la línea */}
      <span className="absolute -bottom-[9px] -right-[8px] text-[16px] text-[#aaaaaa] z-40 bg-black leading-none">✦</span>

      <div 
        className={`overflow-hidden aspect-square relative w-full mb-6 flex items-center justify-center ${userRole === 'cliente' ? 'cursor-pointer' : ''}`} 
        onClick={() => { if(userRole === 'cliente') setProductoSeleccionado(producto); }}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="animate-spin text-white text-2xl">✦</span>
          </div>
        )}

        <img 
          ref={imgRef}
          src={producto.imagen_url} 
          alt={producto.titulo} 
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-contain transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} 
        />
        
        {userRole === 'admin' && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} className="bg-black/80 p-2 text-white rounded-full">✏️</button>
            <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} className="bg-black/80 p-2 text-white rounded-full text-red-500">🗑️</button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow items-center text-center w-full">
        {/* Título en 13pt */}
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
                    // Cuadro ajustado: 24x24px, texto en 12pt
                    className={`w-[24px] h-[24px] flex items-center justify-center text-[12px] tracking-[0.1em] transition-all border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-white border-[#555555] hover:border-white') : 'border-red-900 text-red-500 cursor-not-allowed opacity-50'}`}
                  >
                    {talla}
                  </button>
                  <span className={`text-[10px] tracking-[0.1em] uppercase leading-none ${isAvailable ? 'text-red-600' : 'text-red-900'}`}>
                    {stock === 0 ? '0' : stock}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Descripción en 12pt y blanco puro garantizado */}
        <p className="text-white text-[12px] line-clamp-2 leading-relaxed mb-6 uppercase w-full">
          {producto.descripcion}
        </p>

        {userRole === 'cliente' && !producto.vendido && (
            <div className="flex gap-2 mt-auto w-full justify-center z-30">
               <button onClick={onComprar} className={`w-full py-3 text-[10px] tracking-[0.2em] font-bold uppercase transition-colors border outline-none ${canBuy ? 'bg-transparent text-white border-[#555555] hover:border-white' : 'bg-transparent text-[#555555] border-[#333333] cursor-not-allowed'}`}>
                 {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
               </button>
            </div>
        )}
      </div>
    </div>
  );
}