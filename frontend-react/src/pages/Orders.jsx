import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useKeycloak } from '@react-keycloak/web';
import { ShoppingBag, Calendar, List, X, Clock, CheckCircle, Hash, Loader2, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null); // Pour voir les produits d'une commande

    const { keycloak } = useKeycloak();
    const isAdmin = keycloak.hasRealmRole('ADMIN');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const endpoint = isAdmin ? '/api/orders' : '/api/orders/my-orders';
            const res = await api.get(endpoint);
            setOrders(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, [isAdmin]);

    const handleCancel = async (id) => {
        if (window.confirm("Annuler définitivement cette commande ?")) {
            try {
                await api.put(`/api/orders/${id}/cancel`);
                toast.success("Commande annulée");
                fetchOrders();
            } catch (err) { toast.error("Impossible d'annuler"); }
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
            <Toaster position="top-right" />
            <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Vos Transactions</h2>
                <p className="text-gray-500 font-medium">Historique complet de vos achats sécurisés.</p>
            </div>

            <div className="grid gap-6">
                {orders.map(order => (
                    <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center group">
                        <div className="flex items-center space-x-6">
                            <div className="p-5 bg-gray-50 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                <ShoppingBag className="w-8 h-8" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">#ORD-{order.id}</span>
                                <h3 className="text-2xl font-black text-gray-800">{order.totalAmount.toLocaleString()} DH</h3>
                                <div className="flex items-center text-gray-400 text-sm font-medium"><Calendar className="w-4 h-4 mr-2" />{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 mt-6 md:mt-0">
                            <button onClick={() => setSelectedOrder(order)} className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl font-bold flex items-center hover:bg-indigo-600 hover:text-white transition">
                                <List className="w-5 h-5 mr-2" /> Détails ({order.productItems?.length})
                            </button>

                            {order.status === 'CREATED' && !isAdmin && (
                                <button onClick={() => handleCancel(order.id)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}

                            <span className={`px-4 py-2 rounded-xl text-xs font-black flex items-center ${order.status === 'CREATED' ? 'bg-amber-50 text-amber-600' : order.status === 'CANCELED' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {order.status === 'CREATED' ? <Clock className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                {order.status}
              </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* POPUP DÉTAILS DE LA COMMANDE (LISTE DES PRODUITS) */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-secondary/50 backdrop-blur-md flex items-center justify-center z-50 p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black uppercase tracking-tight">Contenu Commande #{selectedOrder.id}</h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-300 hover:text-red-500"><X /></button>
                        </div>

                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {selectedOrder.productItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-6 bg-gray-50 rounded-3xl">
                                    <div className="flex items-center space-x-4">
                                        <Hash className="text-indigo-300 w-5 h-5" />
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase">Produit ID: {item.productId}</p>
                                            <p className="text-lg font-black text-gray-800">{item.price} DH / unité</p>
                                        </div>
                                    </div>
                                    <div className="bg-primary text-white px-4 py-1 rounded-lg font-black text-sm">Quantité: {item.quantity}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t flex justify-between items-center">
                            <span className="text-gray-400 font-bold uppercase tracking-widest">Total Facturé</span>
                            <span className="text-4xl font-black text-primary">{selectedOrder.totalAmount} DH</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;