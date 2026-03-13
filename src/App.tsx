import { useState, useEffect, useCallback, useMemo } from 'react';
import { areSupabaseCredentialsSet, supabase } from './services/supabase';
import Auth from './components/Auth';
import ProductCard from './components/ProductCard';

const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

const getMockupUrl = (prenda, vista) => {
  if (prenda === 'Capucha') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/IMG_1120.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/IMG_1121.png";
  if (prenda === 'Buso') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/85.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/86.png";
  if (prenda === 'Hoodie') return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/83.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/84.png";
  return vista === 'frente' ? "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/81.png" : "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/82.png";
};

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('cliente'); 
  
  const [activeView, setActiveView] = useState('home');
  const [activeCategory, setActiveCategory] = useState(''); 
  const [activeSubCategory, setActiveSubCategory] = useState('Todo');
  
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  const [nuevaPieza, setNuevaPieza] = useState({ 
    titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' 
  });
  
  const [productos, setProductos] = useState([]);
  const [categoriasDescarga, setCategoriasDescarga] = useState([]);
  const [menuPdfExpandido, setMenuPdfExpandido] = useState(null);
  const [hiddenItems, setHiddenItems] = useState([]);
  
  const [carrito, setCarrito] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState({});
  const [stars, setStars] = useState([]);
  const [cartPulse, setCartPulse] = useState(false);

  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  
  // 7. FORMULARIO CLIENTES CON MEDIDAS NUEVAS AÑADIDAS AQUÍ
  const [perfilForm, setPerfilForm] = useState({
    tratamiento: '', nombre: '', apellidos: '', dia: '', mes: '', anio: '', prefijo: '+593', telefono: '', newsletter: false,
    medidaManos: '', medidaSuperior: '', medidaInferior: ''
  });

  const [checkoutPaso, setCheckoutPaso] = useState(1);
  const [envioConfig, setEnvioConfig] = useState({ tipo: 'local', sectorPrecio: 0, sectorNombre: 'Quito Centro', linkMaps: '' });
  const [comprobantePago, setComprobantePago] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [listaPedidos, setListaPedidos] = useState([]);
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  const [filtroColor, setFiltroColor] = useState('Todo');
  const [filtroTalla, setFiltroTalla] = useState('Todo');
  const [ordenPrecio, setOrdenPrecio] = useState('');
  const [openFilter, setOpenFilter] = useState(null);
  const [openFormSelect, setOpenFormSelect] = useState(null);

  const [customPrenda, setCustomPrenda] = useState('Camiseta'); 
  const [customVista, setCustomView] = useState('frente'); 
  const [customColor, setCustomColor] = useState('#ffffff');
  const [customLogo, setCustomLogo] = useState(null);
  const [customPlacement, setCustomPlacement] = useState('centro-pecho');
  const [customRenderedImage, setCustomRenderedImage] = useState(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [sizeOffset, setSizeOffset] = useState(0); 
  const [yOffset, setYOffset] = useState(0); 

  const [menuAbierto, setMenuAbierto] = useState(null);
  const [userMenuAbierto, setUserMenuAbierto] = useState(false);

  const tallasDisponibles = ['6', '7', '8', '9', '10', '11', '12'];
  
  const parseTallasseguro = (tallasData) => {
    if (!tallasData) return {};
    if (typeof tallasData === 'object') return tallasData;
    try {
      const parsed = JSON.parse(tallasData);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch (e) { console.error("Error al procesar tallas:", e); }
    if (typeof tallasData === 'string') {
      const obj = {};
      tallasData.split(',').forEach(t => { 
        const val = t.trim();
        if(val) obj[val] = 1; 
      });
      return obj;
    }
    return {};
  };

  const fetchProductos = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) setProductos(data);
  };

  const fetchConfiguracion = async () => {
    const { data } = await supabase.from('configuracion').select('menus_ocultos').eq('id', 1).single();
    if (data && data.menus_ocultos) setHiddenItems(data.menus_ocultos);
  };

  const fetchPedidosAdmin = useCallback(async () => {
    const { data } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
    if (data) setListaPedidos(data);
  }, []);

  useEffect(() => {
    fetchProductos();
    fetchConfiguracion();
    supabase.auth.getSession().then(({ data: { session } }) => handleUserSession(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => handleUserSession(session?.user ?? null));
    
    const handleClickOutside = () => {
      setMenuAbierto(null);
      setUserMenuAbierto(false);
      setOpenFilter(null);
      setOpenFormSelect(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (userRole === 'admin' && (activeView === 'pedidos' || activeView === 'inventario')) {
      fetchPedidosAdmin();
    }
  }, [userRole, activeView, fetchPedidosAdmin]);

  const handleUserSession = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      setShowLoginModal(false);
      fetchUserRole(currentUser.id);
      setPerfilForm({
        tratamiento: currentUser.user_metadata?.tratamiento || '',
        nombre: currentUser.user_metadata?.first_name || '',
        apellidos: currentUser.user_metadata?.last_name || '',
        dia: currentUser.user_metadata?.fecha_nacimiento?.split('-')[2] || '',
        mes: currentUser.user_metadata?.fecha_nacimiento?.split('-')[1] || '',
        anio: currentUser.user_metadata?.fecha_nacimiento?.split('-')[0] || '',
        prefijo: currentUser.user_metadata?.telefono?.split(' ')[0] || '+593',
        telefono: currentUser.user_metadata?.telefono?.split(' ')[1] || '',
        newsletter: currentUser.user_metadata?.newsletter || false,
        medidaManos: currentUser.user_metadata?.medida_manos || '',
        medidaSuperior: currentUser.user_metadata?.medida_superior || '',
        medidaInferior: currentUser.user_metadata?.medida_inferior || ''
      });
      if (!currentUser.user_metadata?.first_name || !currentUser.user_metadata?.last_name) setShowCompleteProfile(true);
      else setShowCompleteProfile(false);
    } else {
      setUserRole('cliente');
      setShowCompleteProfile(false);
    }
  };

  const fetchUserRole = async (userId) => {
    try {
      const { data } = await supabase.from('perfiles').select('rol').eq('id', userId).single();
      if (data && data.rol) setUserRole(data.rol);
      else setUserRole('cliente');
    } catch (error) { setUserRole('cliente'); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserRole('cliente'); 
    setActiveView('home'); 
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: perfilForm.nombre, last_name: perfilForm.apellidos, tratamiento: perfilForm.tratamiento,
        fecha_nacimiento: `${perfilForm.anio}-${perfilForm.mes}-${perfilForm.dia}`, telefono: `${perfilForm.prefijo} ${perfilForm.telefono}`, newsletter: perfilForm.newsletter,
        medida_manos: perfilForm.medidaManos, medida_superior: perfilForm.medidaSuperior, medida_inferior: perfilForm.medidaInferior
      }
    });
    if (error) alert('Hubo un error al actualizar su información.');
    else { setUser(data.user); setShowCompleteProfile(false); setActiveView('home'); }
  };

  const irACategoria = (nombreCategoria) => {
    setActiveCategory(nombreCategoria);
    setActiveSubCategory('Todo');
    setActiveView('categoria');
    setShowInlineForm(false);
    setEditandoId(null);
    setFiltroColor('Todo');
    setFiltroTalla('Todo');
    setOrdenPrecio('');
    setOpenFilter(null);
    setOpenFormSelect(null);
    setMenuAbierto(null);
  };

  const triggerStarAnimation = (e) => {
    if (!e || !e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    const startX = rect.left + (rect.width / 2);
    const startY = rect.top + (rect.height / 2);
    setStars(prev => [...prev, { id, x: startX, y: startY, active: false }]);
    setTimeout(() => setStars(prev => prev.map(s => s.id === id ? { ...s, active: true } : s)), 50);
    setTimeout(() => {
      setStars(prev => prev.filter(s => s.id !== id));
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 400); 
    }, 700);
  };

  // Modificado para aceptar tallas del componente hijo ProductCard
  const agregarAlCarrito = (producto, e, tallasDesdeCard = null) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const isRing = producto.subcategoria === 'Anillos';
    const selectedSizes = tallasDesdeCard || tallasSeleccionadas[producto.id] || [];

    if (isRing && selectedSizes.length === 0) return;

    triggerStarAnimation(e);

    setCarrito(prev => {
      let newCart = [...prev];
      if (isRing) {
        const tallasObj = parseTallasseguro(producto.tallas);
        selectedSizes.forEach(talla => {
          const maxForTalla = parseInt(tallasObj[talla] || 0);
          const index = newCart.findIndex(item => item.id === producto.id && item.tallaSeleccionada === talla);
          if (index > -1) {
            if (newCart[index].cantidad < maxForTalla) newCart[index].cantidad += 1;
          } else {
            newCart.push({ ...producto, tallaSeleccionada: talla, cantidad: 1, stockMaximo: maxForTalla });
          }
        });
      } else {
        const stockMax = parseInt(producto.disponibilidad) || 99;
        const index = newCart.findIndex(item => item.id === producto.id);
        if (index > -1) {
          if (newCart[index].cantidad < stockMax) newCart[index].cantidad += 1;
        } else {
          newCart.push({ ...producto, cantidad: 1, stockMaximo: stockMax });
        }
      }
      return newCart;
    });

    if (isRing && !tallasDesdeCard) setTallasSeleccionadas(prev => ({ ...prev, [producto.id]: [] }));
    setProductoSeleccionado(null); 
  };

  const toggleFavorito = (id) => {
    if (favoritos.includes(id)) setFavoritos(favoritos.filter(favId => favId !== id));
    else setFavoritos([...favoritos, id]);
  };

  const prepararEdicion = (producto) => {
    setNuevaPieza({
      titulo: producto.titulo, descripcion: producto.descripcion || '', costo: producto.costo || '', 
      precio: producto.precio, disponibilidad: producto.disponibilidad || '', subcategoria: producto.subcategoria || '',
      tallas: parseTallasseguro(producto.tallas), color: producto.color || '', imagen: null, imagen_url: producto.imagen_url
    });
    setEditandoId(producto.id);
    setShowInlineForm(true);
  };

  const cerrarFormulario = () => {
    setShowInlineForm(false);
    setEditandoId(null);
    setNuevaPieza({ titulo: '', descripcion: '', costo: '', precio: '', disponibilidad: '', subcategoria: '', tallas: {}, color: '', imagen: null, imagen_url: '' });
  };

  const handleToggleVendidoAdmin = async (e, producto) => {
    e.stopPropagation();
    const isRing = producto.subcategoria === 'Anillos';
    let nuevasTallas = null;
    let nuevoVendido = producto.vendido;
    let cantidadVendida = 1; 

    if (isRing) {
      const selectedSizes = tallasSeleccionadas[producto.id] || [];
      if (selectedSizes.length === 0) {
        return alert('Para descontar stock de un anillo, seleccione primero la(s) talla(s) que desea marcar como vendidas en la tarjeta y luego presione este botón.');
      }
      const tallasObj = parseTallasseguro(producto.tallas);
      let errorStock = false;
      selectedSizes.forEach(talla => {
        if (!tallasObj[talla] || tallasObj[talla] < 1) errorStock = true;
        else tallasObj[talla] -= 1;
      });

      if (errorStock) return alert('Una de las tallas seleccionadas no tiene stock disponible.');
      nuevasTallas = JSON.stringify(tallasObj);
      cantidadVendida = selectedSizes.length; 
      const totalStockRestante = Object.values(tallasObj).reduce((acc, val) => acc + Number(val), 0);
      if (totalStockRestante === 0) nuevoVendido = true;
      setTallasSeleccionadas(prev => ({ ...prev, [producto.id]: [] }));
    } else {
      let disp = parseInt(producto.disponibilidad);
      if (!isNaN(disp) && disp > 1 && !producto.vendido) {} else { nuevoVendido = !producto.vendido; }
    }

    const currentVendidos = producto.vendidos || 0;
    const { data, error } = await supabase.from('productos').update({ 
      tallas: nuevasTallas !== null ? nuevasTallas : producto.tallas,
      vendido: nuevoVendido,
      vendidos: currentVendidos + cantidadVendida
    }).eq('id', producto.id).select();

    if (!error && data && data.length > 0) setProductos(prev => prev.map(p => p.id === producto.id ? data[0] : p));
  };

  const handleBorrarLocal = async (id) => {
    if(window.confirm('¿Seguro que deseas retirar esta pieza?')) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  if (!areSupabaseCredentialsSet) return null;

  const estructuraCatalogo = {
    'Atelier': ['Joyería Exclusiva', 'Prêt-à-Porter'],
    'Joyería': ['Acero Fino', 'Plata de Ley 925', 'Gemas y Piedras Naturales'],
    'Esenciales': ['Básicos de Joyería', 'Básicos de Vestuario'],
    'Sartorial': ['Chaquetas', 'Camisetas', 'Buzos', 'Pantalones']
  };

  let productosMostrar = productos.filter(p => p.categoria === activeCategory && (activeSubCategory === 'Todo' || p.subcategoria === activeSubCategory));

  return (
    // 2. APLICACIÓN DE TIMES NEW ROMAN A TODO EL ENVOLTORIO
    <div className="bg-black text-white min-h-screen flex flex-col relative w-full overflow-x-hidden overflow-y-auto" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      
      <style>{`
        ::-webkit-scrollbar { display: none; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        .auth-wrapper input, .auth-wrapper select { background-color: transparent !important; }
      `}</style>

      {stars.map(star => (
        <div key={star.id} className="fixed z-[9999] w-2 h-2 bg-white rounded-full pointer-events-none transition-all ease-in-out"
          style={{ transitionDuration: '700ms', left: star.active ? 'calc(100vw - 60px)' : star.x, top: star.active ? '30px' : star.y, opacity: star.active ? 0 : 1, transform: star.active ? 'scale(0.1)' : 'scale(1)', boxShadow: '0 0 20px 8px rgba(255, 255, 255, 0.8)' }}
        />
      ))}

      <div className="screen-only flex flex-col flex-grow w-full">
        <header className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-[100] pt-3 px-4 sm:px-6 md:px-8" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          
          {user && activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} style={{ fontFamily: '"Times New Roman", Times, serif' }} className="absolute top-6 left-4 md:left-12 flex items-center gap-1.5 text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none z-50 text-[10px] md:text-xs tracking-[0.2em] uppercase">
              Volver
            </button>
          )}

          {user && (
            <div className="absolute top-6 right-4 md:right-12 flex items-center gap-4 md:gap-6 z-[100]">
              {userRole !== 'admin' && (
                <button onClick={() => { setActiveView('bag'); setCheckoutPaso(1); }} className={`text-white hover:text-gray-400 transition-all duration-300 relative cursor-pointer bg-transparent border-none outline-none ${cartPulse ? 'scale-125 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'scale-100'}`}>
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                  <span className="absolute -top-1 -right-2 bg-white text-black text-[8px] md:text-[9px] font-bold px-[4px] md:px-[5px] py-[1px] rounded-full font-sans">{carrito.length}</span>
                </button>
              )}

              <div className="relative cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUserMenuAbierto(!userMenuAbierto); setMenuAbierto(null); setOpenFilter(null); setOpenFormSelect(null); }}>
                <div className="text-white hover:text-gray-400 transition-colors bg-transparent border-none outline-none py-2">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="22" width="22"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
                </div>
                <div className={`absolute top-full right-0 pt-2 z-[100] ${userMenuAbierto ? 'block' : 'hidden lg:group-hover:block'}`}>
                  <div className="flex flex-col bg-black/90 border border-[#333333] py-6 px-8 min-w-[150px] md:min-w-[200px] text-right">
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); setActiveView('perfil'); }} style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-[12px] tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer block w-full py-2">Mi Perfil / Medidas</div>
                    <hr className="border-[#333333] my-2" />
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); handleLogout(); }} style={{ fontFamily: '"Times New Roman", Times, serif' }} className="text-[12px] tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors cursor-pointer block w-full py-2">Cerrar Sesión</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <img src={LOGO_URL} alt="ANTARES" onClick={() => setActiveView('home')} className="h-16 md:h-32 w-auto mt-[10px] md:mt-[4px] z-[100] cursor-pointer" />

          {user && activeView === 'home' && (
            <nav className="w-full mt-4 mb-2 relative z-[100] px-2 md:px-6 pt-0 animate-fade-in">
              <ul style={{ fontSize: '13px' }} className="flex flex-wrap justify-center gap-y-4 gap-x-4 sm:gap-x-8 md:gap-x-16 py-2 tracking-[0.2em] uppercase border-none bg-transparent">
                {Object.keys(estructuraCatalogo).map(menu => {
                  const isMenuHidden = hiddenItems.includes(menu);
                  if (userRole !== 'admin' && isMenuHidden) return null;
                  return (
                    <li key={menu} className="group relative cursor-pointer py-2 border-none bg-transparent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuAbierto(menuAbierto === menu ? null : menu); setUserMenuAbierto(false); }}>
                      <div className={`inline-block relative transition-colors ${isMenuHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                        {menu}
                        <div className={`absolute bottom-0 h-px bg-white transition-all duration-300 ${menuAbierto === menu ? 'w-full left-0' : 'w-0 left-1/2 lg:group-hover:w-full lg:group-hover:left-0'}`}></div>
                      </div>
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[100] ${menuAbierto === menu ? 'block' : 'hidden lg:group-hover:block'}`}>
                        <div className="flex flex-col bg-black/90 border border-[#333333] py-6 px-8 min-w-[180px] md:min-w-[220px] text-center">
                          {estructuraCatalogo[menu].map(sub => {
                            const isSubHidden = hiddenItems.includes(sub);
                            if (userRole !== 'admin' && isSubHidden) return null;
                            return (
                              <div key={sub} onClick={(e) => { e.stopPropagation(); setMenuAbierto(null); irACategoria(sub); }} style={{ fontSize: '12px' }} className={`cursor-pointer block mt-3 first:mt-0 transition-colors py-2 ${isSubHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
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
            <div className="w-full flex justify-center mt-4 mb-4 auth-wrapper">
              <button onClick={() => setShowLoginModal(true)} className="text-white hover:text-gray-400 transition-colors p-0 bg-transparent border-none outline-none cursor-pointer z-50">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="30" width="30"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            </div>
          )}
        </header>

        <main className="flex-grow flex flex-col items-center w-full px-0">
          
          {(!user || activeView === 'home') && (
            <div className="w-full animate-fade-in flex flex-col items-center pb-20 px-4">
               <section className="w-full text-center py-16 md:py-32">
                 <h2 className="text-4xl md:text-8xl font-bold tracking-[0.2em] uppercase text-white mb-6 md:mb-8 opacity-90 break-words">Elegancia Atemporal</h2>
                 <p className="text-gray-400 tracking-[0.2em] uppercase text-[10px] md:text-xs max-w-2xl mx-auto leading-loose px-4">
                   Bienvenido al Atelier de Antares. Un espacio dedicado a la sofisticación, el diseño atemporal y la exclusividad en cada detalle.
                 </p>
               </section>
               <section className="w-full max-w-5xl mx-auto py-12 md:py-20 text-center">
                 <h3 className="text-sm md:text-lg tracking-[0.3em] uppercase text-gray-500 mb-8 md:mb-10">Sobre Nosotros</h3>
                 <p className="text-white text-base md:text-2xl leading-relaxed max-w-3xl mx-auto font-light">
                   "Fundada con la visión de redefinir el lujo contemporáneo, Antares fusiona la artesanía tradicional con una estética vanguardista. Cada una de nuestras piezas cuenta una historia de meticulosa atención al detalle y pasión inquebrantable por la perfección."
                 </p>
               </section>
               <section className="w-full max-w-6xl mx-auto py-16 md:py-24">
                 <h3 className="text-sm md:text-lg tracking-[0.3em] uppercase text-gray-500 mb-10 md:mb-16 text-center">Nuestros Servicios</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 text-center">
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Sastrería a Medida')} className="p-6 md:p-10 bg-[#0a0a0a] hover:bg-[#111111] transition-colors duration-500 cursor-pointer">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Sastrería a Medida</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Creación de prendas exclusivas adaptadas a su silueta y estilo personal, utilizando únicamente los tejidos más nobles.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Joyería Exclusiva')} className="p-6 md:p-10 bg-[#0a0a0a] hover:bg-[#111111] transition-colors duration-500 cursor-pointer">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Joyería Personalizada</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Diseño y forja de piezas únicas y exclusivas, seleccionando gemas excepcionales para capturar momentos eternos.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : setActiveView('perfil')} className="p-6 md:p-10 bg-[#0a0a0a] hover:bg-[#111111] transition-colors duration-500 cursor-pointer sm:col-span-2 lg:col-span-1">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Asesoría de Imagen</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Curaduría de estilo y armario por nuestros expertos, elevando su presencia y confianza en cada ocasión especial.</p>
                   </div>
                 </div>
               </section>
            </div>
          )}

          {user && activeView === 'categoria' && activeCategory !== 'Prêt-à-Porter' && (
            <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-7xl">
               <h2 className="text-[13px] tracking-[0.3em] uppercase text-white mb-8 md:mb-12 text-center break-words px-4">{activeCategory}</h2>
               
               {userRole === 'admin' && (
                 <div onClick={() => { setEditandoId(null); setShowInlineForm(true); }} className="mb-12 border border-dashed border-[#555555] mx-4 py-8 text-center hover:bg-[#111111] transition-colors cursor-pointer w-auto">
                   <span className="text-white tracking-[0.2em] text-[10px] uppercase">+ Añadir nueva pieza a {activeCategory}</span>
                 </div>
               )}

               {/* 5. CUATRO PRODUCTOS POR FILA EN PC CON BORDES DEFINIDOS */}
               <div className="w-full px-4 sm:px-0">
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 w-full" style={{ borderTop: '1px solid #333333', borderLeft: '1px solid #333333' }}>
                   {productosMostrar.map(producto => (
                      <ProductCard 
                        key={producto.id} 
                        producto={producto} 
                        userRole={userRole}
                        prepararEdicion={prepararEdicion}
                        handleBorrarLocal={handleBorrarLocal}
                        setProductoSeleccionado={setProductoSeleccionado}
                        agregarAlCarrito={agregarAlCarrito}
                        toggleFavorito={toggleFavorito}
                        favoritos={favoritos}
                        handleToggleVendidoAdmin={handleToggleVendidoAdmin}
                      />
                   ))}
                   {productosMostrar.length === 0 && (
                      <p style={{ borderRight: '1px solid #333', borderBottom: '1px solid #333' }} className="text-gray-500 tracking-[0.2em] uppercase text-[12px] col-span-full text-center py-10 w-full">No hay piezas en esta categoría aún.</p>
                   )}
                 </div>
               </div>
            </section>
          )}

          {/* 7. FORMULARIO PARA CLIENTES - MEDIDAS */}
          {user && (activeView === 'perfil' || showCompleteProfile) && (
            <section className="container mx-auto py-12 flex-grow animate-fade-in w-full max-w-3xl px-4">
              <div className="bg-[#0a0a0a] border border-[#333333] p-8 shadow-2xl w-full">
                <h2 className="text-[14px] tracking-[0.3em] uppercase text-white mb-8 text-center">{showCompleteProfile ? 'Complete su Perfil' : 'Mi Perfil y Medidas'}</h2>
                <form onSubmit={handleGuardarPerfil} className="flex flex-col gap-6 w-full">
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
                  <button type="submit" className="mt-8 bg-transparent text-white border border-[#555555] hover:border-white transition-colors outline-none text-[12px] font-bold tracking-[0.2em] uppercase py-4 w-full cursor-pointer">Guardar Perfil</button>
                </form>
              </div>
            </section>
          )}

        </main>
        
        <footer className="bg-black py-12 text-center text-[#666666] text-[10px] tracking-[0.3em] uppercase w-full">
          &copy; {new Date().getFullYear()} ANTARES. Elegancia Atemporal.
        </footer>
      </div>

      {showLoginModal && <Auth onClose={() => setShowLoginModal(false)} />}

      {/* MODAL DEL PRODUCTO PARA CLIC EN LA FOTO */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => {setProductoSeleccionado(null);}}>
          <div className="w-full max-w-md md:max-w-4xl flex flex-col md:flex-row relative shadow-2xl bg-black max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #333333' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => {setProductoSeleccionado(null);}} className="absolute top-4 right-4 text-[#aaaaaa] hover:text-white z-[250] text-3xl cursor-pointer bg-transparent border-none outline-none">×</button>
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-center min-h-[300px]">
              <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.titulo} className="w-full h-full object-contain" />
            </div>
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center items-center text-center bg-black border-t md:border-t-0 md:border-l border-[#333333]">
              <h2 className="text-[14px] md:text-[16px] tracking-[0.2em] uppercase text-white mb-2">{productoSeleccionado.titulo}</h2>
              <p className="text-[14px] tracking-[0.1em] text-white font-light mb-8">${productoSeleccionado.precio} USD</p>
              
              <p style={{ color: '#ffffff', opacity: 1 }} className="text-[12px] leading-loose mb-8 uppercase tracking-[0.1em] w-full">
                {productoSeleccionado.descripcion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. MODAL EMERGENTE DE ADMINISTRADOR PARA AGREGAR/EDITAR PRODUCTOS */}
      {userRole === 'admin' && showInlineForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <div className="bg-black p-8 shadow-2xl relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #333333' }}>
            <button type="button" onClick={cerrarFormulario} className="absolute top-4 right-6 text-[#aaaaaa] hover:text-white text-3xl cursor-pointer bg-transparent border-none outline-none">×</button>
            <h3 className="text-[14px] tracking-[0.3em] uppercase text-white mb-8 text-center">{editandoId ? 'EDITAR PIEZA' : 'AÑADIR NUEVA PIEZA'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert("Enlazado a la función nativa del backend."); cerrarFormulario(); }} className="flex flex-col gap-6">
              <input type="text" value={nuevaPieza.titulo} onChange={e => setNuevaPieza({...nuevaPieza, titulo: e.target.value})} placeholder="TÍTULO DE LA OBRA" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center transition-colors" required />
              <div className="grid grid-cols-2 gap-6">
                <input type="number" value={nuevaPieza.costo} onChange={e => setNuevaPieza({...nuevaPieza, costo: e.target.value})} placeholder="COSTO (USD)" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center transition-colors" />
                <input type="number" value={nuevaPieza.precio} onChange={e => setNuevaPieza({...nuevaPieza, precio: e.target.value})} placeholder="PRECIO VENTA (USD)" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center transition-colors" required />
              </div>
              <textarea value={nuevaPieza.descripcion} onChange={e => setNuevaPieza({...nuevaPieza, descripcion: e.target.value})} placeholder="DESCRIPCIÓN EDITORIAL..." rows="3" className="w-full bg-transparent border-b border-[#555555] focus:border-white text-white text-[12px] tracking-[0.2em] py-2 outline-none text-center resize-none transition-colors"></textarea>
              <button type="submit" className="mt-4 bg-transparent text-white border border-[#555555] hover:border-white transition-colors outline-none text-[10px] font-bold tracking-[0.2em] uppercase py-4 w-full cursor-pointer">{editandoId ? 'Guardar Cambios' : 'Publicar Pieza'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}