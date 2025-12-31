import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './services/keycloak';
import Layout from './components/Layout';
import Products from './pages/Products';
import Orders from './pages/Orders'; // Vérifiez bien cet import !

function App() {
    return (
        <ReactKeycloakProvider
            authClient={keycloak}
            initOptions={{ onLoad: 'login-required', checkLoginIframe: false }}
        >
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<div className="text-center p-20 text-3xl font-bold">Bienvenue 👋</div>} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/orders" element={<Orders />} /> {/* C'est ici que le composant est appelé */}
                    </Routes>
                </Layout>
            </BrowserRouter>
        </ReactKeycloakProvider>
    );
}

export default App;