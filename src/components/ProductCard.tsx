import { useState, useRef, useEffect } from 'react';

interface Product {
  id: string | number;
  titulo: string;
  precio: number | string;
  imagen_url: string;
  descripcion?: string;
  subcategoria?: string;
  tallas?: string | object;
  vendido?: boolean;
}

interface ProductCardProps {
  key?: any;
  producto: Product;
  userRole: string;
  prepararEdicion: (p: Product) => void;
  handleBorrarLocal: (id: string | number) => void;
  setProductoSeleccionado: (p: Product) => void;
  agregarAlCarrito: (p: Product, e: any, tallas?: string[]) => void;
  toggleFavorito: (id: string | number) => void;
  favoritos: (string | number)[];
  handleToggleVendidoAdmin: (e: any, p: Product) => void;
}

export default function ProductCard({ 
  producto, 
  userRole, 
  prepararEdicion, 
  handleBorrarLocal, 
  setProductoSeleccionado, 
  agregarAlCarrito, 
  toggleFavorito, 
  favoritos, 
  handleToggleVendidoAdmin 
}: ProductCardProps) {
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([]);
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
      agregarAlCarrito(producto, e, tallasSeleccionadas);
      setTallasSeleccionadas([]);
    }
  };

  const tallasObj = typeof producto.tallas === 'string' ? JSON.parse(producto.tallas || '{}') : (producto.tallas || {});
  const tallasDisponibles = ['6', '7', '8', '9', '10', '11', '12'];

  return (
    <div style={{ borderRight: '1px solid #333333', borderBottom: '1px solid #333333', position: 'relative', display: 'flex', flexDirection: 'column', padding: '24px', fontFamily: '"Times New Roman", Times, serif', backgroundColor: 'transparent' }}>
      
      {/* 6. ESTRELLA DE 4 PUNTOS EN LA INTERSECCIÓN */}
      <span style={{ position: 'absolute', bottom: '-13px', right: '-10px', color: '#ffffff', fontSize: '22px', backgroundColor: '#000000', padding: '0 2px', zIndex: 50, lineHeight: 1 }}>✦</span>

      <div 
        style={{ position: 'relative', width: '100%', aspectRatio: '1/1', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: userRole === 'cliente' ? 'pointer' : 'default', overflow: 'hidden' }} 
        onClick={() => { if(userRole === 'cliente') setProductoSeleccionado(producto); }}
      >
        {/* 8. ANIMACIÓN DE CARGA PARA LAS FOTOS */}
        {!imgLoaded && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
            <span className="animate-spin block" style={{ color: 'white', fontSize: '32px' }}>✦</span>
          </div>
        )}

        <img 
          ref={imgRef}
          src={producto.imagen_url} 
          alt={producto.titulo} 
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.7s ease-in-out' }} 
        />
        
        {userRole === 'admin' && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '8px', zIndex: 20 }}>
            <button onClick={(e) => { e.stopPropagation(); prepararEdicion(producto); }} style={{ background: 'rgba(0,0,0,0.8)', padding: '8px', color: 'white', borderRadius: '50%', border: '1px solid #333', cursor: 'pointer' }}>✏️</button>
            <button onClick={(e) => { e.stopPropagation(); handleBorrarLocal(producto.id); }} style={{ background: 'rgba(0,0,0,0.8)', padding: '8px', color: 'red', borderRadius: '50%', border: '1px solid #333', cursor: 'pointer' }}>🗑️</button>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, alignItems: 'center', textAlign: 'center', width: '100%' }}>
        {/* 2. TÍTULOS EN 13 PUNTOS TIMES NEW ROMAN */}
        <h4 style={{ fontSize: '13px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ffffff', marginBottom: '8px', margin: 0 }}>{producto.titulo}</h4>
        <span style={{ fontSize: '13px', letterSpacing: '0.1em', color: '#ffffff', fontWeight: 'lighter', marginBottom: '24px', display: 'block', marginTop: '8px', fontVariantNumeric: 'tabular-nums lining-nums' }}>${producto.precio} USD</span>
        
        {isRing && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '24px', width: '100%' }}>
            {tallasDisponibles.map(talla => {
              const stock = parseInt(tallasObj[talla] || 0);
              const isAvailable = stock > 0;
              const isSelected = tallasSeleccionadas.includes(talla);
              
              return (
                <div key={talla} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  {/* 3. CUADRADO DE TALLAS A 2PX CON NÚMEROS A 12 PUNTOS */}
                  <button 
                    type="button"
                    onClick={(e) => { if (isAvailable) handleSelectTalla(e, talla); }}
                    style={{
                      minWidth: '24px', height: '24px', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', letterSpacing: '0.1em', border: isAvailable ? (isSelected ? '1px solid #ffffff' : '1px solid #555555') : '1px solid #333333',
                      backgroundColor: isSelected ? '#ffffff' : 'transparent', color: isAvailable ? (isSelected ? '#000000' : '#ffffff') : '#555555',
                      cursor: isAvailable ? 'pointer' : 'not-allowed', outline: 'none', transition: 'all 0.3s', fontVariantNumeric: 'tabular-nums lining-nums'
                    }}
                  >
                    {talla}
                  </button>
                  <span style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: isAvailable ? '#aaaaaa' : '#555555', fontVariantNumeric: 'tabular-nums lining-nums' }}>
                    {stock === 0 ? '0' : stock}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        
        {/* 4. DESCRIPCIÓN COLOR BLANCO Y 13 PUNTOS FORZADO (UN PUNTO MÁS GRANDE) */}
        <p style={{ color: '#ffffff', fontSize: '13px', lineHeight: '1.8', marginBottom: '24px', textTransform: 'uppercase', width: '100%', margin: 0, opacity: 1 }}>
          {producto.descripcion}
        </p>

        {/* BOTÓN CLIENTES */}
        {userRole === 'cliente' && !producto.vendido && (
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%', justifyContent: 'center' }}>
               <button onClick={onComprar} style={{ flexGrow: 1, padding: '12px', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 'bold', textTransform: 'uppercase', border: canBuy ? '1px solid #ffffff' : '1px solid #555555', backgroundColor: 'transparent', color: canBuy ? '#ffffff' : '#555555', cursor: canBuy ? 'pointer' : 'not-allowed', outline: 'none' }}>
                 {canBuy ? 'COMPRAR' : 'ELIJA TALLA'}
               </button>
               <button onClick={(e) => { e.stopPropagation(); toggleFavorito(producto.id); }} style={{ padding: '12px 24px', border: '1px solid #333333', backgroundColor: 'transparent', color: '#ffffff', cursor: 'pointer', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', outline: 'none' }}>
                 {favoritos.includes(producto.id) ? 'QUITAR' : 'GUARDAR'}
               </button>
            </div>
        )}

        {/* BOTÓN ADMIN RESTAURADO */}
        {userRole === 'admin' && (
          <button onClick={(e) => handleToggleVendidoAdmin(e, producto)} style={{ width: '100%', padding: '12px', marginTop: 'auto', fontSize: '10px', fontWeight: 'bold', letterSpacing: '0.2em', textTransform: 'uppercase', border: '1px solid #ffffff', backgroundColor: producto.vendido ? 'transparent' : '#ffffff', color: producto.vendido ? '#aaaaaa' : '#000000', cursor: 'pointer', outline: 'none' }}>
            {producto.vendido ? 'Desmarcar Venta' : 'Marcar como Vendida'}
          </button>
        )}
      </div>
    </div>
  );
}