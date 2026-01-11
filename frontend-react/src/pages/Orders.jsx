import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useKeycloak } from '@react-keycloak/web';
import {
    ShoppingBag, Calendar, List, X, Clock,
    CheckCircle, Hash, Loader2, Trash2, AlertCircle,
    ShoppingCart, Package, User as UserIcon
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const { keycloak } = useKeycloak();
    const isAdmin = keycloak.hasRealmRole('ADMIN');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const endpoint = isAdmin ? '/api/orders' : '/api/orders/my-orders';
            const res = await api.get(endpoint);
            // Sécurité : s'assurer que res.data est bien un tableau
            setOrders(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Erreur API:", err);
            toast.error("Impossible de charger les commandes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [isAdmin]);

    const handleCancel = async (id) => {
        if (window.confirm("Voulez-vous vraiment annuler cette commande ?")) {
            try {
                await api.put(`/api/orders/${id}/cancel`);
                toast.success("Commande annulée");
                fetchOrders();
            } catch (err) {
                toast.error("Erreur lors de l'annulation");
            }
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
            <p className="text-gray-400 font-bold">Synchronisation du registre...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700 pb-10">
            <Toaster position="top-right" />
            <div>
                <h2 className="text-4xl font-black text-indigo-900 tracking-tight text-left uppercase">Commandes</h2>
                <p className="text-gray-500 font-medium italic text-left">
                    {isAdmin ? "Monitoring global des flux de vente." : "Historique de vos acquisitions personnelles."}
                </p>
            </div>

            <div className="grid gap-6">
                {orders.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-gray-100">
                        <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold">Aucun mouvement détecté dans la base.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-center group relative overflow-hidden">
                            <div className="flex items-center space-x-6 z-10">
                                <div className={`p-5 rounded-2xl transition-colors ${order.status === 'CANCELED' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <ShoppingBag className="w-8 h-8" />
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">ID #ORD-{order.id}</span>
                                    <h3 className="text-3xl font-black text-gray-900">{order?.totalAmount?.toLocaleString() || 0} <small className="text-sm">DH</small></h3>
                                    <div className="flex items-center text-gray-400 text-sm font-medium mt-1">
                                        <Calendar className="w-4 h-4 mr-2 opacity-40" />{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Date inconnue'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 mt-6 md:mt-0 z-10">
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-gray-50 text-gray-600 px-6 py-3 rounded-2xl font-bold flex items-center hover:bg-indigo-600 hover:text-white transition shadow-sm"
                                >
                                    <List className="w-5 h-5 mr-2" /> Détails
                                </button>

                                {order.status === 'CREATED' && !isAdmin && (
                                    <button onClick={() => handleCancel(order.id)} className="p-4 text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition border border-red-50">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}

                                <span className={`px-5 py-2.5 rounded-2xl text-xs font-black flex items-center border ${
                                    order.status === 'CREATED' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        order.status === 'CANCELED' ? 'bg-red-50 text-red-600 border-red-100' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                  {order.status === 'CREATED' ? <Clock className="w-4 h-4 mr-2 animate-pulse" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    {order.status}
                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODALE DÉTAILS - SÉCURISÉE CONTRE LES CRASHES */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-secondary/70 backdrop-blur-lg flex items-center justify-center z-50 p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl p-12 animate-in zoom-in duration-300 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className="text-left">
                                <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Facture</h3>
                                <p className="text-primary font-bold">Commande #{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-3 bg-gray-50 rounded-full text-gray-300 hover:text-red-500 transition"><X className="w-6 h-6" /></button>
                        </div>

                        {/* Liste des produits avec sécurité optional chaining */}
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-4 custom-scrollbar relative z-10">
                            {selectedOrder.productItems && selectedOrder.productItems.length > 0 ? (
                                selectedOrder.productItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-white p-3 rounded-2xl shadow-sm text-indigo-400"><Package className="w-6 h-6" /></div>
                                            <div className="text-left">
                                                {/* Affiche le nom s'il existe, sinon l'ID */}
                                                <p className="text-lg font-black text-gray-800">{item.productName || `Produit ID: ${item.productId}`}</p>
                                                <p className="text-sm font-bold text-gray-400">{item.price?.toLocaleString() || 0} DH / unité</p>
                                            </div>
                                        </div>
                                        <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-sm">x{item.quantity || 1}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 py-10 font-bold">Aucun détail produit disponible.</p>
                            )}
                        </div>

                        <div className="mt-10 pt-8 border-t-4 border-double border-gray-100 flex justify-between items-end relative z-10">
                            <div className="text-left">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Montant Total Payé</p>
                                <p className="text-5xl font-black text-indigo-600">{selectedOrder.totalAmount?.toLocaleString() || 0} <small className="text-xl">DH</small></p>
                            </div>
                            <div className="text-right">
                                <UserIcon className="w-5 h-5 text-gray-200 ml-auto mb-2" />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Client Ref</p>
                                <p className="text-xs font-mono text-gray-400">{selectedOrder.customerId?.substring(0, 12)}...</p>
                            </div>
                        </div>

                        {/* Décoration de fond pour le style */}
                        <Hash className="absolute -left-10 -bottom-10 w-64 h-64 text-gray-50 -z-0" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;