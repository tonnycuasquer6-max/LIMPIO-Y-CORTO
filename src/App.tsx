import { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { CartProvider, useCart } from './contexts/CartContext';
import ProductCard from './components/ProductCard';
import Auth from './components/Auth';
// Si ya separaste el Admin o el PretAPorter, impórtalos aquí:
// import AdminDashboard from './components/AdminDashboard';
// import PretAPorter from './components/PretAPorter';

const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

// Este es el catálogo original para que funcionen tus menús
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

  // Traemos el estado del carrito desde tu nuevo Contexto
  const { carrito, cartPulse } = useCart();

  const cristalOpacoSubmenuClass = "flex flex-col bg-white/5 backdrop-blur-md py-6 px-8 shadow-none border-none"; 
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

  let productosMostrar = productos.filter(p => p.categoria === activeCategory && (activeSubCategory === 'Todo' || p.subcategoria === activeSubCategory));

  return (
    <div className="bg-black text-white min-h-screen font-serif flex flex-col relative w-full overflow-x-hidden overflow-y-auto">
      
      {/* HEADER VISUAL RESTAURADO */}
      <div className="screen-only flex flex-col flex-grow w-full">
        <header className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-[100] pt-3 px-4 sm:px-6 md:px-8" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          
          {user && activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="absolute top-6 left-4 md:left-12 flex items-center gap-1.5 text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none z-50 text-[10px] md:text-xs tracking-[0.2em] uppercase">
              Volver
            </button>
          )}

          {user && (
            <div className="absolute top-6 right-4 md:right-12 flex items-center gap-4 md:gap-6 z-[100]">
              {/* ICONO DEL CARRITO */}
              {userRole !== 'admin' && (
                <button onClick={() => setActiveView('bag')} className={`text-white hover:text-gray-400 transition-all duration-300 relative cursor-pointer bg-transparent border-none outline-none ${cartPulse ? 'scale-125 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'scale-100'}`}>
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="20" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                  <span className="absolute -top-1 -right-2 bg-white text-black text-[8px] md:text-[9px] font-bold px-[4px] md:px-[5px] py-[1px] rounded-full">{carrito.length}</span>
                </button>
              )}

              {/* MENU DE USUARIO */}
              <div className="relative cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUserMenuAbierto(!userMenuAbierto); setMenuAbierto(null); }}>
                <div className="text-white hover:text-gray-400 transition-colors bg-transparent border-none outline-none py-2">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="22" width="22"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
                </div>
                <div className={`absolute top-full right-0 pt-2 z-[100] ${userMenuAbierto ? 'block' : 'hidden lg:group-hover:block'}`}>
                  <div className={`${cristalOpacoSubmenuClass} min-w-[150px] md:min-w-[200px] text-right`}>
                    <div onClick={(e) => { e.stopPropagation(); setUserMenuAbierto(false); handleLogout(); }} className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer outline-none block w-full py-2">Cerrar Sesión</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LOGO */}
          <img src={LOGO_URL} alt="ANTARES" onClick={() => setActiveView('home')} className="h-16 md:h-32 w-auto mt-[10px] md:mt-[4px] z-[100] cursor-pointer" />

          {/* NAVEGACIÓN PRINCIPAL */}
          {user && activeView === 'home' && (
            <nav className="w-full mt-4 mb-2 relative z-[100] px-2 md:px-6 pt-0 animate-fade-in">
              <ul className="flex flex-wrap justify-center gap-y-4 gap-x-4 sm:gap-x-8 md:gap-x-16 py-2 text-[10px] md:text-sm tracking-[0.1em] sm:tracking-[0.2em] md:tracking-[0.3em] uppercase border-none bg-transparent">
                {Object.keys(estructuraCatalogo).map(menu => {
                  const isMenuHidden = hiddenItems.includes(menu);
                  if (userRole !== 'admin' && isMenuHidden) return null;
                  return (
                    <li key={menu} className="group relative cursor-pointer py-2 border-none bg-transparent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuAbierto(menuAbierto === menu ? null : menu); setUserMenuAbierto(false); }}>
                      <div className={`inline-block relative transition-colors ${isMenuHidden ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                        {menu}
                        <div className={`${menuUnderlineClass} ${menuAbierto === menu ? 'w-full left-0' : 'w-0 left-1/2 lg:group-hover:w-full lg:group-hover:left-0'}`}></div>
                      </div>
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-[100] ${menuAbierto === menu ? 'block' : 'hidden lg:group-hover:block'}`}>
                        <div className={`${cristalOpacoSubmenuClass} min-w-[180px] md:min-w-[220px] text-center`}>
                          {estructuraCatalogo[menu].map(sub => {
                            const isSubHidden = hiddenItems.includes(sub);
                            if (userRole !== 'admin' && isSubHidden) return null;
                            return (
                              <div key={sub} onClick={(e) => { e.stopPropagation(); setMenuAbierto(null); irACategoria(sub); }} className={`cursor-pointer block mt-3 first:mt-0 text-[10px] md:text-xs transition-colors py-2 ${isSubHidden ? 'text-red-500' : 'text-gray-400 hover:text-gray-300'}`}>
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

        {/* MAIN ROUTER */}
        <main className="flex-grow flex flex-col items-center w-full px-4 sm:px-6 md:px-8">
          
          {/* VISTA HOME RESTAURADA */}
          {(!user || activeView === 'home') && (
            <div className="w-full animate-fade-in flex flex-col items-center pb-20">
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
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Sastrería a Medida')} className="p-6 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Sastrería a Medida</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Creación de prendas exclusivas adaptadas a su silueta y estilo personal, utilizando únicamente los tejidos más nobles.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : irACategoria('Joyería Exclusiva')} className="p-6 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Joyería Personalizada</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Diseño y forja de piezas únicas y exclusivas, seleccionando gemas excepcionales para capturar momentos eternos.</p>
                   </div>
                   <div onClick={() => !user ? setShowLoginModal(true) : setActiveView('perfil')} className="p-6 md:p-10 bg-zinc-900/40 hover:bg-zinc-900 transition-colors duration-500 cursor-pointer sm:col-span-2 lg:col-span-1">
                     <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase text-white mb-4 md:mb-6">Asesoría de Imagen</h4>
                     <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.1em] leading-loose">Curaduría de estilo y armario por nuestros expertos, elevando su presencia y confianza en cada ocasión especial.</p>
                   </div>
                 </div>
               </section>
            </div>
          )}

          {/* VISTA CATEGORÍA (Renderizando los ProductCards) */}
          {user && activeView === 'categoria' && activeCategory !== 'Prêt-à-Porter' && (
            <section className="container mx-auto py-8 md:py-16 flex-grow animate-fade-in w-full max-w-7xl">
               <h2 className="text-[10px] md:text-[14px] tracking-[0.3em] uppercase text-white mb-8 md:mb-12 text-center border-b border-white/10 pb-4 md:pb-6 break-words">{activeCategory}</h2>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 w-full">
                 {productosMostrar.map(producto => (
                    <ProductCard 
                      key={producto.id} 
                      producto={producto} 
                      userRole={userRole} 
                      setProductoSeleccionado={setProductoSeleccionado}
                    />
                 ))}
                 {productosMostrar.length === 0 && (
                    <p className="text-gray-500 tracking-[0.2em] uppercase text-[10px] col-span-full text-center py-10 w-full">No hay piezas en esta categoría aún.</p>
                 )}
               </div>
            </section>
          )}

        </main>
        
        <footer className="bg-black py-8 md:py-12 text-center text-gray-600 text-[8px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.5em] uppercase border-none mt-auto px-4 screen-only w-full">
          &copy; {new Date().getFullYear()} ANTARES. Elegancia Atemporal.
        </footer>
      </div>

      {showLoginModal && <Auth onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}

// Wrapper Principal
export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}