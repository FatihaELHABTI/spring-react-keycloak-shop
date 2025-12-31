import React from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { LayoutDashboard, Package, ShoppingCart, LogOut, User, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const { keycloak } = useKeycloak();
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'CLIENT'] },
        { name: 'Produits', path: '/products', icon: Package, roles: ['ADMIN', 'CLIENT'] },
        { name: 'Commandes', path: '/orders', icon: ShoppingCart, roles: ['ADMIN', 'CLIENT'] },
    ];

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar avec nouveau thème Tailwind 4 */}
            <aside className="w-72 bg-secondary text-white flex flex-col shadow-2xl">
                <div className="p-8 flex items-center space-x-3 border-b border-white/10">
                    <div className="bg-primary p-2 rounded-lg">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-xl font-black tracking-tighter">SECURE-SHOP</span>
                </div>

                <nav className="flex-1 p-6 space-y-3">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center p-4 rounded-xl transition-all duration-300 group ${
                                location.pathname === item.path ? 'bg-primary shadow-lg scale-105' : 'hover:bg-white/5'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 mr-4 ${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                            <span className="font-semibold">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <button onClick={() => keycloak.logout()} className="m-6 p-4 flex items-center justify-center bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <LogOut className="w-5 h-5 mr-3" /> <span className="font-bold">Déconnexion</span>
                </button>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-10">
                    <div>
                        <h1 className="text-sm text-gray-400 font-medium">Bon retour,</h1>
                        <p className="text-lg font-bold text-gray-800 uppercase tracking-tight">{keycloak.tokenParsed?.preferred_username}</p>
                    </div>
                    <div className="flex items-center space-x-4">
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${keycloak.hasRealmRole('ADMIN') ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
              {keycloak.hasRealmRole('ADMIN') ? '👑 Administrateur' : '👤 Client'}
            </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;