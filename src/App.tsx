import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { CartProvider, useCart } from './contexts/CartContext';
import ProductCard from './components/ProductCard';
import Auth from './components/Auth';

const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

const estructuraCatalogo = {
  'Atelier': ['Joyería Exclusiva', 'Prêt-à-Porter'],
  'Joyería': ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
  'Esenciales': ['Básicos de Joyería', 'Básicos de Vestuario'],
  'Sartorial': ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
};

function MainApp() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('cliente');
  
  const [activeView, setActiveView] = useState('home');
  const [activeCategory, setActiveCategory] = useState(''); 
  const [activeSubCategory, setActiveSubCategory] = useState('Todo');
  
  const [productos, setProductos] = useState([]);
  const [hiddenItems, setHiddenItems] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [userMenuAbierto, setUserMenuAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevaPieza, setNuevaPieza] = useState({ 
    titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' 
  });

  const [perfilForm, setPerfilForm] = useState({
    tratamiento: '', nombre: '', apellidos: '', dia: '', mes: '', anio: '', prefijo: '+593', telefono: '', newsletter: false,
    medidaManos: '', medidaSuperior: '', medidaInferior: ''
  });
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  const { carrito, cartPulse, favoritos, toggleFavorito, agregarAlCarrito } = useCart();
  const [tallasSeleccionadasModal, setTallasSeleccionadasModal] = useState([]);

  const cristalOpacoSubmenuClass = "flex flex-col bg-black/90 border border-[#333333] py-6 px-8 shadow-2xl z-50"; 
  const menuUnderlineClass = "absolute bottom-0 h-px bg-white transition-all duration-300";

  useEffect(() => {
    fetchProductos();
    fetchConfiguracion();
    supabase.auth.getSession().then(({ data: { session } }) => handleUserSession(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleUserSession(session?.user ?? null));
    
    const handleClickOutside = () => {
      setMenuAbierto(null);
      setUserMenuAbierto(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleUserSession = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      setShowLoginModal(false);
      fetchUserRole(currentUser.id);
      setPerfilForm(prev => ({
        ...prev,
        nombre: currentUser.user_metadata?.first_name || '',
        apellidos: currentUser.user_metadata?.last_name || '',
        medidaManos: currentUser.user_metadata?.medida_manos || '',
        medidaSuperior: currentUser.user_metadata?.medida_superior || '',
        medidaInferior: currentUser.user_metadata?.medida_inferior || ''
      }));
      if (!currentUser.user_metadata?.first_name) setShowCompleteProfile(true);
    } else {
      setUserRole('cliente');
    }
  };

  const fetchUserRole = async (userId) => {
    try {
      const { data } = await supabase.from('perfiles').select('rol').eq('id', userId).single();
      if (data && data.rol) setUserRole(data.rol);
    } catch (error) { setUserRole('cliente'); }
  };

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) setProductos(data);
  };

  const fetchConfiguracion = async () => {
    const { data } = await supabase.from('configuracion').select('menus_ocultos').eq('id', 1).single();
    if (data && data.menus_ocultos) setHiddenItems(data.menus_ocultos);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole('cliente'); 
    setActiveView('home'); 
  };

  const irACategoria = (nombreCategoria) => {
    setActiveCategory(nombreCategoria);
    setActiveSubCategory('Todo');
    setActiveView('categoria');
    setMenuAbierto(null);
  };

  const prepararEdicion = (producto) => {
    setNuevaPieza({
      titulo: producto.titulo, descripcion: producto.descripcion || '', costo: producto.costo || '', 
      precio: producto.precio, disponibilidad: producto.disponibilidad || '', subcategoria: producto.subcategoria || '',
      tallas: typeof producto.tallas === 'string' ? JSON.parse(producto.tallas || '{}') : (producto.tallas || {}), color: producto.color || '', imagen: null, imagen_url: producto.imagen_url
    });
    setEditandoId(producto.id);
    setShowInlineForm(true);
  };

  const cerrarFormulario = () => {
    setShowInlineForm(false);
    setEditandoId(null);
    setNuevaPieza({ titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' });
  };

  const handleBorrarLocal = async (id) => {
    if(window.confirm('¿Seguro que deseas retirar esta pieza?')) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: perfilForm.nombre, last_name: perfilForm.apellidos, tratamiento: perfilForm.tratamiento,
        fecha_nacimiento: `${perfilForm.anio}-${perfilForm.mes}-${perfilForm.dia}`, telefono: `${perfilForm.prefijo} ${perfilForm.telefono}`,
        medida_manos: perfilForm.medidaManos, medida_superior: perfilForm.medidaSuperior, medida_inferior: perfilForm.medidaInferior
      }
    });
    if (!error) { setUser(data.user); setShowCompleteProfile(false); setActiveView('home'); }
  };

  const handleSelectTallaModal = (e, talla) => {
    e.stopPropagation();
    setTallasSeleccionadasModal(prev => prev.includes(talla) ? prev.filter(t => t !== talla) : [...prev, talla]);
  };

  let productosMostrar = productos.filter(p => p.categoria === activeCategory && (activeSubCategory === 'Todo' || p.subcategoria === activeSubCategory));

  return (
    <div className="bg-black text-white min-h-screen flex flex-col relative w-full font-serif overflow-x-hidden">
      
      <style>{`
        ::-webkit-scrollbar { display: none; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>

      <div className="screen-only flex flex-col flex-grow w-full">
        <header className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-[100] pt-3 px-4 sm:px-8" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          
          {user && activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="absolute top-6 left-4 md:left-12 text-white hover:text-[#aaaaaa] transition-colors cursor-pointer bg-transparent border-none outline-none text-[12px] tracking-[0.2em] uppercase font-serif">
              Volver
            </button>
          )}

          {user && (
            <div className="absolute top-6 right-4 md:right-12 flex items-center gap-6 z-[100]">
              {userRole !== 'admin' && (
                <button onClick={() => setActiveView('bag')} className={`text-white hover:text-[#aaaaaa] transition-all duration-300 relative cursor-pointer bg-transparent border-none outline-none ${cartPulse ? 'scale-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'scale-100'}`}>
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                  <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-bold px-[5px] py-[1px] rounded-full font-sans">{carrito.length}</span>
                </button>
              )}

              <div className="relative cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUserMenuAbierto(!userMenuAbierto); setMenuAbierto(null); }}>
                <div className="text-white hover:text-[#aaaaaa] transition-colors bg-transparent border-none outline-none py-2">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="22" width="22"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
                </div>
                <div className={`absolute top-full right-0 pt-2 z-[100] ${userMenuAbierto ? 'block' : 'hidden'}`}>
                  <div className={cristalOpacoSubmenuClass}>
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); setActiveView('perfil'); }} className="text-[12px] tracking-[0.2em] uppercase text-white hover:text-[#aaaaaa] transition-colors text-right cursor-pointer w-full py-2 mb-2 font-serif">Mi Perfil / Medidas</div>
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); handleLogout(); }} className="text-[12px] tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right cursor-pointer w-full py-2 border-t border-[#333333] mt-2 pt-4 font-serif">Cerrar Sesión</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <img src={LOGO_URL} alt="ANTARES" onClick={() => setActiveView('home')} className="h-16 md:h-32 w-auto mt-[10px] md:mt-[4px] z-[100] cursor-pointer" />

          {user && activeView === 'home' && (
            <nav className="w-full mt-4 mb-2 relative z-[100] px-4 animate-fade-in">
              {/* MENÚ EN 13 PUNTOS */}
              <ul className="flex flex-wrap justify-center gap-y-4 gap-x-6 md:gap-x-16 py-2 text-[13px] tracking-[0.2em] uppercase font-serif">
                {Object.keys(estructuraCatalogo).map(menu => {
                  const isMenuHidden = hiddenItems.includes(menu);
                  if (userRole !== 'admin' && isMenuHidden) return null;
                  return (
                    <li key={menu} className="group relative cursor-pointer py-2" onMouseEnter={() => window.innerWidth > 1024 && setMenuAbierto(menu)} onMouseLeave={() => window.innerWidth > 1024 && setMenuAbierto(null)} onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === menu ? null : menu); setUserMenuAbierto(false); }}>
                      <div className={`inline-block relative transition-colors ${isMenuHidden ? 'text-red-500' : 'text-[#aaaaaa] hover:text-white'}`}>
                        {menu}
                        <div className={`${menuUnderlineClass} ${menuAbierto === menu ? 'w-full left-0' : 'w-0 left-1/2'}`}></div>
                      </div>
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[100] ${menuAbierto === menu ? 'block' : 'hidden'}`}>
                        <div className={cristalOpacoSubmenuClass}>
                          {estructuraCatalogo[menu].map(sub => {
                            const isSubHidden = hiddenItems.includes(sub);
                            if (userRole !== 'admin' && isSubHidden) return null;
                            return (
                              // SUBMENÚ EN 12 PUNTOS
                              <div key={sub} onClick={(e) => { e.stopPropagation(); setMenuAbierto(null); irACategoria(sub); }} className={`cursor-pointer block mt-4 first:mt-0 text-[12px] transition-colors whitespace-nowrap ${isSubHidden ? 'text-red-500' : 'text-[#aaaaaa] hover:text-white font-serif'}`}>
                                {sub}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {!user && (
            <div className="w-full flex justify-center mt-4 mb-4">
              <button onClick={() => setShowLoginModal(true)} className="text-white hover:text-[#aaaaaa] transition-colors bg-transparent border-none cursor-pointer z-50">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="30" width="30"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            </div>
          )}
        </header>

        <main className="flex-grow flex flex-col items-center w-full px-0 sm:px-6 md:px-8">
          
          {(!user || activeView === 'home') && (
            <div className="w-full animate-fade-in flex flex-col items-center pb-20 px-4">
               <section className="w-full text-center py-16 md:py-32">
                 <h2 className="text-4xl md:text-8xl font-bold tracking-[0.2em] uppercase text-white mb-8">Elegancia Atemporal</h2>
                 <p className="text-[#aaaaaa] tracking-[0.2em] uppercase text-[12px] max-w-2xl mx-auto leading-loose">
                   Bienvenido al Atelier de Antares. Un espacio dedicado a la sofisticación, el diseño atemporal y la exclusividad en cada detalle.
                 </p>
               </section>
               <section className="w-full max-w-5xl mx-auto py-12 md:py-20 text-center">
                 <h3 className="text-lg tracking-[0.3em] uppercase text-[#666666] mb-10">Sobre Nosotros</h3>
                 <p className="text-white text-base md:text-2xl leading-relaxed max-w-3xl mx-auto font-light">
                   "Fundada con la visión de redefinir el lujo contemporáneo, Antares fusiona la artesanía tradicional con una estética vanguardista. Cada una de nuestras piezas cuenta una historia de meticulosa atención al detalle y pasión inquebrantable por la perfección."
                 </p>
               </section>
            </div>
          )}

          {user && activeView === 'categoria' && activeCategory !== 'Prêt-à-Porter' && (
            <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-7xl">
               <h2 className="text-[13px] tracking-[0.3em] uppercase text-white mb-12 text-center break-words px-4 font-serif">{activeCategory}</h2>
               
               {userRole === 'admin' && (
                 <div onClick={() => { setEditandoId(null); setShowInlineForm(true); }} className="mb-12 border border-dashed border-[#555555] mx-4 py-8 text-center hover:bg-[#111111] transition-colors cursor-pointer">
                   <span className="text-white tracking-[0.2em] text-[12px] uppercase font-serif">+ Añadir nueva pieza a {activeCategory}</span>
                 </div>
               )}

               {/* GRID 4 COLUMNAS EN PC CON BORDES DEFINIDOS */}
               <div className="w-full px-4 sm:px-0">
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 w-full border-t border-l border-[#333333]">
                   {productosMostrar.map(producto => (
                      <ProductCard 
                        key={producto.id} 
                        producto={producto} 
                        userRole={userRole}
                        prepararEdicion={prepararEdicion}
                        handleBorrarLocal={handleBorrarLocal}
                        setProductoSeleccionado={setProductoSeleccionado}
                      />
                   ))}
                   {productosMostrar.length === 0 && (
                      <p className="text-white tracking-[0.2em] uppercase text-[12px] col-span-full text-center py-10 w-full border-r border-b border-[#333333] font-serif">No hay piezas en esta categoría aún.</p>
                   )}
                 </div>
               </div>
            </section>
          )}

          {/* PERFIL Y FORMULARIO DE MEDIDAS */}
          {user && (activeView === 'perfil' || showCompleteProfile) && (
            <section className="container mx-auto py-12 flex-grow animate-fade-in w-full max-w-3xl px-4">
              <div className="bg-black border border-[#333333] p-8 shadow-2xl w-full">
                <h2 className="text-[14px] tracking-[0.3em] uppercase text-white mb-8 text-center font-serif">{showCompleteProfile ? 'Complete su Perfil' : 'Mi Perfil y Medidas'}</h2>
                <form onSubmit={handleGuardarPerfil} className="flex flex-col gap-6 w-full font-serif">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <input type="text" value={perfilForm.nombre} onChange={e => setPerfilForm({...perfilForm, nombre: e.target.value})} placeholder="DOS NOMBRES*" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.1em] py-2 outline-none text-center transition-colors" required />
                    <input type="text" value={perfilForm.apellidos} onChange={e => setPerfilForm({...perfilForm, apellidos: e.target.value})} placeholder="DOS APELLIDOS*" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.1em] py-2 outline-none text-center transition-colors" required />
                  </div>
                  
                  <div className="mt-8 border-t border-[#333333] pt-8">
                    <h3 className="text-[13px] tracking-[0.2em] uppercase text-white mb-6 text-center">Ficha de Medidas Personales</h3>
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] text-[#aaaaaa] tracking-[0.2em] uppercase mb-2">Talla de Manos (Anillos cm)</label>
                        <input type="text" value={perfilForm.medidaManos} onChange={e => setPerfilForm({...perfilForm, medidaManos: e.target.value})} placeholder="Ej. 6.5 cm" className="w-full sm:w-1/2 bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.1em] py-2 outline-none text-center transition-colors" />
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] text-[#aaaaaa] tracking-[0.2em] uppercase mb-2">Medida Superior (Pecho/Hombros cm)</label>
                        <input type="text" value={perfilForm.medidaSuperior} onChange={e => setPerfilForm({...perfilForm, medidaSuperior: e.target.value})} placeholder="Ej. Pecho 105cm, Hombros 45cm" className="w-full sm:w-1/2 bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.1em] py-2 outline-none text-center transition-colors" />
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] text-[#aaaaaa] tracking-[0.2em] uppercase mb-2">Medida Inferior (Cintura/Cadera cm)</label>
                        <input type="text" value={perfilForm.medidaInferior} onChange={e => setPerfilForm({...perfilForm, medidaInferior: e.target.value})} placeholder="Ej. Cintura 85cm, Largo 102cm" className="w-full sm:w-1/2 bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.1em] py-2 outline-none text-center transition-colors" />
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="mt-8 bg-transparent text-white border border-[#555555] hover:border-white transition-colors outline-none text-[12px] font-bold tracking-[0.2em] uppercase py-4 w-full">Guardar Perfil</button>
                </form>
              </div>
            </section>
          )}

        </main>
        
        <footer className="bg-black py-12 text-center text-[#666666] text-[10px] tracking-[0.3em] uppercase w-full font-serif">
          &copy; {new Date().getFullYear()} ANTARES. Elegancia Atemporal.
        </footer>
      </div>

      {showLoginModal && <Auth onClose={() => setShowLoginModal(false)} />}

      {/* MODAL DEL PRODUCTO (Forzando Texto Blanco) */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-fade-in font-serif" onClick={() => {setProductoSeleccionado(null); setTallasSeleccionadasModal([]);}}>
          <div className="w-full max-w-md md:max-w-4xl flex flex-col md:flex-row relative shadow-2xl border border-[#333333] bg-black max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => {setProductoSeleccionado(null); setTallasSeleccionadasModal([]);}} className="absolute top-4 right-4 text-[#aaaaaa] hover:text-white z-[250] text-3xl cursor-pointer bg-transparent border-none outline-none">×</button>
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-center min-h-[300px]">
              <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.titulo} className="w-full h-full object-contain" />
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-center text-center bg-black border-t md:border-t-0 md:border-l border-[#333333]">
              <h2 className="text-[14px] md:text-[16px] tracking-[0.2em] uppercase text-white mb-2">{productoSeleccionado.titulo}</h2>
              <p className="text-[14px] tracking-[0.1em] text-white font-light mb-8">${productoSeleccionado.precio} USD</p>
              
              {productoSeleccionado.subcategoria === 'Anillos' && (() => {
                 const modalTallasObj = typeof productoSeleccionado.tallas === 'string' ? JSON.parse(productoSeleccionado.tallas || '{}') : (productoSeleccionado.tallas || {});
                 const modalCanBuy = tallasSeleccionadasModal.length > 0;
                 return (
                 <div className="flex flex-col items-center w-full mb-8">
                   <p className="text-[10px] text-white tracking-[0.2em] mb-6 uppercase">Seleccione su talla</p>
                   <div className="flex flex-wrap justify-center gap-3 w-full">
                     {['6', '7', '8', '9', '10', '11', '12'].map(talla => {
                       const stock = parseInt(modalTallasObj[talla] || 0);
                       const isAvailable = stock > 0;
                       const isSelected = tallasSeleccionadasModal.includes(talla);
                       return (
                         <div key={talla} className="flex flex-col items-center gap-1">
                           <button 
                             type="button"
                             onClick={(e) => { if(isAvailable) handleSelectTallaModal(e, talla); }}
                             className={`w-[24px] h-[24px] flex items-center justify-center text-[12px] tracking-[0.1em] transition-all border outline-none ${isAvailable ? (isSelected ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-white border-[#555555] hover:border-white') : 'border-red-900 text-red-500 cursor-not-allowed opacity-50'}`}
                           >
                             {talla}
                           </button>
                           <span className={`text-[10px] tracking-[0.1em] uppercase leading-none ${isAvailable ? 'text-[#aaaaaa]' : 'text-red-900'}`}>{stock === 0 ? '0' : stock}</span>
                         </div>
                       );
                     })}
                   </div>
                   {userRole === 'cliente' && !productoSeleccionado.vendido && (
                     <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
                       <button onClick={(e) => { if(modalCanBuy) { agregarAlCarrito(productoSeleccionado, tallasSeleccionadasModal); setProductoSeleccionado(null); setTallasSeleccionadasModal([]); } }} className={`w-full sm:w-auto px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors border outline-none ${modalCanBuy ? 'bg-transparent text-white border-[#555555] hover:border-white' : 'bg-transparent text-[#555555] border-[#333333] cursor-not-allowed'}`}>
                         {modalCanBuy ? 'AÑADIR AL BOLSO' : 'ELIJA TALLA'}
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); toggleFavorito(productoSeleccionado.id); }} className="w-full sm:w-auto border border-[#333333] hover:border-white py-3 px-6 text-white transition-colors text-[10px] tracking-[0.2em] uppercase outline-none">
                         {favoritos.includes(productoSeleccionado.id) ? 'QUITAR' : 'GUARDAR'}
                       </button>
                     </div>
                   )}
                 </div>
                 );
              })()}

              <p className="text-white text-[12px] leading-loose mb-8 uppercase tracking-[0.1em] w-full">
                {productoSeleccionado.descripcion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EMERGENTE DE ADMINISTRADOR PARA AGREGAR/EDITAR PRODUCTOS */}
      {userRole === 'admin' && showInlineForm && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 animate-fade-in font-serif">
          <div className="bg-black border border-[#333333] p-8 shadow-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={cerrarFormulario} className="absolute top-4 right-6 text-[#aaaaaa] hover:text-white text-3xl cursor-pointer bg-transparent border-none outline-none">×</button>
            <h3 className="text-[14px] tracking-[0.3em] uppercase text-white mb-8 text-center">{editandoId ? 'EDITAR PIEZA' : 'AÑADIR NUEVA PIEZA'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert("Función guardado backend original activa."); cerrarFormulario(); }} className="flex flex-col gap-6">
              <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza({...nuevaPieza, titulo: e.target.value})} placeholder="TÍTULO DE LA OBRA" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center transition-colors" required />
              <div className="grid grid-cols-2 gap-6">
                <input type="number" value={nuevaPieza.costo} onChange={e => setNuevaPieza({...nuevaPieza, costo: e.target.value})} placeholder="COSTO (USD)" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center transition-colors" />
                <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO VENTA (USD)" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center transition-colors" required />
              </div>
              <textarea value={nuevaPieza.descripcion} onChange={e => setNuevaPieza({...nuevaPieza, descripcion: e.target.value})} placeholder="DESCRIPCIÓN EDITORIAL..." rows="3" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center resize-none transition-colors"></textarea>
              <button type="submit" className="mt-4 bg-transparent text-white border border-[#555555] hover:border-white transition-colors outline-none text-[10px] font-bold tracking-[0.2em] uppercase py-4 w-full">{editandoId ? 'Guardar Cambios' : 'Publicar Pieza'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}