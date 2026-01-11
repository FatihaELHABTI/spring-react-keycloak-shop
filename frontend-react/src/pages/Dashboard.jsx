import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useKeycloak } from '@react-keycloak/web';
import {
    TrendingUp, ShoppingCart, Package,
    AlertCircle, CheckCircle, Wallet,
    History, LayoutDashboard
} from 'lucide-react';

const Dashboard = () => {
    const [adminStats, setAdminStats] = useState(null);
    const [clientStats, setClientStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { keycloak } = useKeycloak();

    const isAdmin = keycloak.hasRealmRole('ADMIN');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                if (isAdmin) {
                    // L'ADMIN récupère tout
                    const [resP, resO] = await Promise.all([
                        api.get('/api/products/stats'),
                        api.get('/api/orders/stats')
                    ]);
                    setAdminStats({ products: resP.data, orders: resO.data });
                } else {
                    // LE CLIENT récupère ses propres données
                    const res = await api.get('/api/orders/my-stats');
                    setClientStats(res.data);
                }
            } catch (err) {
                console.error("Erreur stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [isAdmin]);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center space-x-6 hover:shadow-md transition-all">
            <div className={`p-4 rounded-2xl ${color}`}>
                <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
                <p className="text-3xl font-black text-gray-900">{value}</p>
            </div>
        </div>
    );

    if (loading) return <div className="p-20 text-center font-bold animate-pulse">Analyse de votre compte...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div>
                <h2 className="text-4xl font-black text-indigo-900 tracking-tight">Mon Dashboard</h2>
                <p className="text-gray-500 font-medium italic">
                    {isAdmin ? "Gestion globale de la plateforme." : "Résumé de votre activité client."}
                </p>
            </div>

            {/* GRILLE DE STATS CONDITIONNELLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isAdmin ? (
                    <>
                        <StatCard title="Revenu Global" value={`${adminStats?.orders.totalRevenue || 0} DH`} icon={TrendingUp} color="bg-indigo-600" />
                        <StatCard title="Ventes Totales" value={adminStats?.orders.totalOrders || 0} icon={ShoppingCart} color="bg-emerald-500" />
                        <StatCard title="Alertes Stock" value={adminStats?.products.lowStock || 0} icon={AlertCircle} color="bg-red-500" />
                    </>
                ) : (
                    <>
                        <StatCard title="Total Dépensé" value={`${clientStats?.spent || 0} DH`} icon={Wallet} color="bg-indigo-600" />
                        <StatCard title="Mes Commandes" value={clientStats?.count || 0} icon={History} color="bg-emerald-500" />
                        <StatCard title="En cours" value={clientStats?.active || 0} icon={CheckCircle} color="bg-amber-500" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* BLOC ÉTAT DU SYSTÈME */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                    <h3 className="text-2xl font-black mb-6 flex items-center">
                        <CheckCircle className="mr-2 text-emerald-500" /> Services Cloud
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {['Auth', 'Gateway', 'Products', 'Orders'].map(s => (
                            <div key={s} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                                <span className="font-bold text-gray-600 text-sm">{s}</span>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* BLOC BIENVENUE PERSONNALISÉ */}
                <div className="bg-secondary p-10 rounded-[3rem] text-white flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black mb-2">Ravi de vous revoir !</h3>
                        <p className="text-indigo-200 font-medium mb-6">
                            Identifiant : <span className="font-mono text-xs">{keycloak.tokenParsed?.preferred_username}</span>
                        </p>
                        <div className="flex space-x-3">
                            <span className="px-4 py-2 bg-white/10 rounded-xl text-xs font-black uppercase">Statut: {isAdmin ? 'Admin' : 'Client'}</span>
                            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black uppercase">Compte Vérifié</span>
                        </div>
                    </div>
                    <LayoutDashboard className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 -rotate-12" />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;