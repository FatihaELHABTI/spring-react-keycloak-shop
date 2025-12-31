import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useKeycloak } from '@react-keycloak/web';
import {
    Plus, Trash2, Edit, X, Save,
    Package, DollarSign, Layers,
    AlertCircle, Loader2
} from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // État pour le produit en cours de création ou modification
    const [currentProduct, setCurrentProduct] = useState({
        name: '',
        description: '',
        price: '',
        stockQuantity: ''
    });

    const { keycloak } = useKeycloak();
    const isAdmin = keycloak.hasRealmRole('ADMIN');

    // 1. Charger les produits depuis le backend
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/products');
            setProducts(res.data);
        } catch (err) {
            console.error("Erreur de chargement", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // 2. Préparer l'ouverture de la modale
    const openModal = (product = { name: '', description: '', price: '', stockQuantity: '' }) => {
        setCurrentProduct(product);
        setIsModalOpen(true);
    };

    // 3. Sauvegarder (Ajout ou Mise à jour)
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentProduct.id) {
                // Mode Edition
                await api.put(`/api/products/${currentProduct.id}`, currentProduct);
            } else {
                // Mode Création
                await api.post('/api/products', currentProduct);
            }
            setIsModalOpen(false);
            fetchProducts(); // Rafraîchir la liste
        } catch (err) {
            alert("Erreur lors de l'opération : " + (err.response?.status === 403 ? "Accès refusé" : "Erreur réseau"));
        }
    };

    // 4. Supprimer un produit
    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit définitivement ?")) {
            try {
                await api.delete(`/api/products/${id}`);
                fetchProducts();
            } catch (err) {
                console.error("Erreur de suppression", err);
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header de la page */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Catalogue</h2>
                    <p className="text-gray-500 font-medium">Gérez vos articles et suivez l'état de votre inventaire.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => openModal()}
                        className="bg-primary hover:scale-105 transition-all text-white px-6 py-3 rounded-2xl font-bold flex items-center shadow-xl shadow-indigo-200"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Nouveau Produit
                    </button>
                )}
            </div>

            {/* État de chargement */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-gray-400 font-bold animate-pulse">Synchronisation avec le stock...</p>
                </div>
            ) : (
                /* Grille des produits */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(product => (
                        <div key={product.id} className="group bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-gray-50 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Package className="w-7 h-7" />
                                </div>
                                {isAdmin && (
                                    <div className="flex space-x-1">
                                        <button onClick={() => openModal(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition"><Edit className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-gray-800 mb-2">{product.name}</h3>
                            <p className="text-gray-400 text-sm mb-8 line-clamp-2 font-medium">{product.description || "Aucune description fournie."}</p>

                            <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                                <div>
                                    <span className="text-3xl font-black text-gray-900">{product.price}</span>
                                    <span className="ml-1 text-primary font-bold">DH</span>
                                </div>
                                <div className={`flex items-center px-3 py-1 rounded-full text-xs font-black ${product.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {product.stockQuantity > 0 ? `Stock: ${product.stockQuantity}` : 'Rupture'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODALE CRUD (Ajout / Modification) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-secondary/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900">
                                        {currentProduct.id ? 'Modifier l\'article' : 'Ajouter au catalogue'}
                                    </h3>
                                    <p className="text-gray-400 text-sm font-medium">Détails techniques du produit.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Libellé Nom */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nom du produit</label>
                                    <input
                                        className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 transition-all outline-none font-bold text-gray-700"
                                        placeholder="ex: Clavier Mécanique RGB"
                                        value={currentProduct.name}
                                        onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                                        required
                                    />
                                </div>

                                {/* Libellé Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Description</label>
                                    <textarea
                                        className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white focus:ring-0 transition-all outline-none font-medium h-28"
                                        placeholder="Décrivez les points forts du produit..."
                                        value={currentProduct.description}
                                        onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Libellé Prix */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Prix (MAD)</label>
                                        <div className="relative">
                                            <input
                                                type="number" step="0.01"
                                                className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold"
                                                placeholder="0.00"
                                                value={currentProduct.price}
                                                onChange={e => setCurrentProduct({...currentProduct, price: e.target.value})}
                                                required
                                            />
                                            <DollarSign className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>

                                    {/* Libellé Stock */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Stock</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none font-bold"
                                                placeholder="0"
                                                value={currentProduct.stockQuantity}
                                                onChange={e => setCurrentProduct({...currentProduct, stockQuantity: e.target.value})}
                                                required
                                            />
                                            <Layers className="w-5 h-5 text-gray-300 absolute left-4 top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg flex items-center justify-center shadow-xl shadow-indigo-100 hover:shadow-indigo-300 hover:-translate-y-1 transition-all active:scale-95">
                                    <Save className="w-6 h-6 mr-3" />
                                    {currentProduct.id ? 'Appliquer les modifications' : 'Confirmer l\'ajout'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;