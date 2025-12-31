import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './services/keycloak';
import Layout from './components/Layout';
import Products from './pages/Products';
import Orders from './pages/Orders'; // Tu peux créer Orders sur le même modèle

function App() {
    return (
        <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={{ onLoad: 'login-required', checkLoginIframe: false }}
        >
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-4">
                                    <div className="text-6xl animate-bounce">👋</div>
                                    <h2 className="text-5xl font-black tracking-tight">Bienvenue sur votre Dashboard</h2>
                                    <p className="text-gray-400 max-w-md mx-auto">Toutes vos opérations micro-services sont centralisées et sécurisées par Keycloak.</p>
                                </div>
                            </div>
                        } />
                        <Route path="/products" element={<Products />} />
                        <Route path="/orders" element={<div className="text-2xl font-bold italic text-gray-300">Section Commandes en cours de synchronisation...</div>} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ReactKeycloakProvider>
    );
}

export default App;