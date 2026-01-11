import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './services/keycloak';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';

function App() {
    return (
        /* onLoad: 'login-required' force l'utilisateur à se connecter via Keycloak dès l'ouverture */
        <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={{ onLoad: 'login-required', checkLoginIframe: false }}
        >
            <BrowserRouter>
                <Layout>
                    <Routes>
                        {/* Route par défaut : Le Dashboard avec les statistiques du backend */}
                        <Route path="/" element={<Dashboard />} />

                        {/* Route du Catalogue : CRUD Admin + Panier Client */}
                        <Route path="/products" element={<Products />} />

                        {/* Route des Commandes : Historique + Détails + Annulation */}
                        <Route path="/orders" element={<Orders />} />

                        {/* Page 404 simple */}
                        <Route path="*" element={
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <h1 className="text-9xl font-black text-indigo-100">404</h1>
                                <p className="text-gray-400 font-bold">Oups ! Cette section n'existe pas.</p>
                            </div>
                        } />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ReactKeycloakProvider>
    );
}

export default App;