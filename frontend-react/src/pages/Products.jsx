import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useKeycloak } from '@react-keycloak/web';
import {
    Plus, ShoppingCart, Eye, Trash2, Edit, X, Save,
    Check, Package, DollarSign, Layers, Loader2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]); // Gestion du panier local
    const [selectedProduct, setSelectedProduct] = useState(null); // Pour la popup détails
    const [isModalOpen, setIsModalOpen] = useState(false); // Pour le CRUD Admin
    const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', price: '', stockQuantity: '' });

    const { keycloak } = useKeycloak();
    const isAdmin = keycloak.hasRealmRole('ADMIN');

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            toast.error("Erreur de connexion au catalogue");
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIQUE DU PANIER ---
    const addToCart = (product) => {
        if (product.stockQuantity <= 0) {
            toast.error("Rupture de stock !");
            return;
        }
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === product.id);
            if (existing) {
                toast.success(`Quantité augmentée pour ${product.name}`);
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            toast.success(`${product.name} ajouté au panier`);
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const finalizeOrder = async () => {
        if (cart.length === 0) return;
        try {
            // On prépare la liste : [{productId, quantity}, ...]
            const orderItems = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }));

            await api.post('/api/orders', orderItems);
            setCart([]); // Vider le panier
            toast.success("Commande validée ! Le stock a été mis à jour.", { duration: 5000 });
            fetchProducts(); // Rafraîchir les stocks affichés
        } catch (err) {
            toast.error("Échec de la commande : Stock insuffisant.");
        }
    };

    // --- ACTIONS ADMIN (CRUD) ---
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentProduct.id) {
                await api.put(`/api/products/${currentProduct.id}`, currentProduct);
                toast.success("Produit mis à jour");
            } else {
                await api.post('/api/products', currentProduct);
                toast.success("Produit créé");
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (err) { toast.error("Erreur de permission ou réseau"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Supprimer ce produit ?")) {
            await api.delete(`/api/products/${id}`);
            fetchProducts();
            toast.success("Produit supprimé");
        }
    };

    return (
        <div className="space-y-8 pb-32">
            <Toaster position="top-right" />

            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">E-Catalogue</h2>
                    <p className="text-gray-500 font-medium">Accumulez vos articles et validez votre panier.</p>
                </div>
                <div className="flex space-x-4">
                    {!isAdmin && cart.length > 0 && (
                        <button onClick={finalizeOrder} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black flex items-center shadow-xl shadow-emerald-100 animate-in slide-in-from-right">
                            <Check className="mr-2" /> Valider la Commande ({cart.reduce((a,b) => a + b.quantity, 0)})
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => { setCurrentProduct({name:'', description:'', price:'', stockQuantity:''}); setIsModalOpen(true); }} className="bg-primary text-white px-6 py-4 rounded-2xl font-black flex items-center shadow-lg">
                            <Plus className="mr-2" /> Nouveau Produit
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(p => (
                        <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group">
                            <div className="flex justify-between mb-6">
                                <div className="p-4 bg-gray-50 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Package className="w-7 h-7" />
                                </div>
                                {isAdmin && (
                                    <div className="flex space-x-1">
                                        <button onClick={() => {setCurrentProduct(p); setIsModalOpen(true);}} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-2xl font-black text-gray-800">{p.name}</h3>
                            <p className="text-gray-400 text-sm font-medium mb-6">Stock disponible: {p.stockQuantity}</p>

                            <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                                <span className="text-3xl font-black text-indigo-600">{p.price} DH</span>
                                <div className="flex space-x-2">
                                    <button onClick={() => setSelectedProduct(p)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-primary transition"><Eye className="w-5 h-5" /></button>
                                    {!isAdmin && (
                                        <button onClick={() => addToCart(p)} disabled={p.stockQuantity <= 0} className="p-3 bg-gray-900 text-white rounded-xl hover:bg-primary disabled:bg-gray-100 transition shadow-lg">
                                            <ShoppingCart className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* POPUP DÉTAILS PRODUIT */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-secondary/40 backdrop-blur-md flex items-center justify-center z-50 p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 relative animate-in zoom-in duration-200">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500"><X /></button>
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-primary mb-6"><Package className="w-10 h-10" /></div>
                        <h2 className="text-4xl font-black text-gray-900 mb-4">{selectedProduct.name}</h2>
                        <p className="text-gray-500 font-medium leading-relaxed mb-8">{selectedProduct.description || "Aucun détail technique supplémentaire."}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-6 rounded-3xl text-center">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prix</span>
                                <span className="text-2xl font-black text-primary">{selectedProduct.price} DH</span>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-3xl text-center">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dispo</span>
                                <span className="text-2xl font-black text-gray-800">{selectedProduct.stockQuantity} unités</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE CRUD ADMIN */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-secondary/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black">{currentProduct.id ? 'Modifier' : 'Ajouter'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <input className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="Nom" value={currentProduct.name} onChange={e=>setCurrentProduct({...currentProduct, name: e.target.value})} required />
                            <textarea className="w-full p-4 bg-gray-50 rounded-2xl border-none font-medium h-24" placeholder="Description" value={currentProduct.description} onChange={e=>setCurrentProduct({...currentProduct, description: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="Prix" value={currentProduct.price} onChange={e=>setCurrentProduct({...currentProduct, price: e.target.value})} required />
                                <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" placeholder="Stock" value={currentProduct.stockQuantity} onChange={e=>setCurrentProduct({...currentProduct, stockQuantity: e.target.value})} required />
                            </div>
                            <button type="submit" className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 flex justify-center"><Save className="mr-2"/> Confirmer</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;