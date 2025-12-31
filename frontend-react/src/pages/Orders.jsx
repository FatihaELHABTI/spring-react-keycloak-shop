import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useKeycloak } from '@react-keycloak/web';
import { ClipboardList, Calendar, DollarSign, Tag, Search, Filter } from 'lucide-react';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { keycloak } = useKeycloak();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Déterminer l'URL selon le rôle (Point 5 du PDF)
                const endpoint = keycloak.hasRealmRole('ADMIN')
                    ? '/api/orders'
                    : '/api/orders/my-orders';

                const response = await api.get(endpoint);
                setOrders(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération des commandes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [keycloak]);

    if (loading) return <div className="flex justify-center p-20 text-primary font-bold animate-pulse">Chargement des données sécurisées...</div>;

    return (
        <div className="space-y-8">
            {/* Header Page */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Commandes</h2>
                    <p className="text-gray-500 font-medium">Suivi en temps réel des transactions du réseau.</p>
                </div>
                <div className="flex space-x-3">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <Filter className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Référence</th>
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Date d'émission</th>
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Client ID</th>
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Montant Total</th>
                        <th className="p-6 text-xs font-black uppercase tracking-widest text-gray-400">Statut</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="p-20 text-center text-gray-300 italic font-medium">
                                Aucune commande enregistrée dans le système.
                            </td>
                        </tr>
                    ) : (
                        orders.map((order) => (
                            <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-primary">
                                            <ClipboardList className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-gray-700">#ORD-{order.id.toString().padStart(4, '0')}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-gray-500 font-medium">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-300" />
                                        {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">{order.customerId.substring(0, 8)}...</span>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center font-black text-gray-900 text-lg">
                                        {order.totalAmount.toLocaleString()}
                                        <span className="ml-1 text-primary text-xs font-bold">MAD</span>
                                    </div>
                                </td>
                                <td className="p-6">
                        <span className={`px-4 py-2 rounded-xl text-xs font-black flex items-center w-max ${
                            order.status === 'CREATED'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                              order.status === 'CREATED' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}></span>
                            {order.status}
                        </span>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Stats Summary (Optionnel pour le look) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary p-8 rounded-[2rem] text-white">
                    <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Volume Total</p>
                    <h3 className="text-3xl font-black">{orders.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()} MAD</h3>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Commandes Actives</p>
                    <h3 className="text-3xl font-black text-gray-900">{orders.length}</h3>
                </div>
            </div>
        </div>
    );
};

export default Orders;