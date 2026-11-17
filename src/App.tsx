import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Checkout } from './pages/Checkout';
import { Home } from './pages/Home';
import { Account, Login } from './pages/Login';
import { ProductDetail, Products } from './pages/Products';
import { Signals } from './pages/Signals';
import { AppStateProvider } from './state/AppState';

export function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:sku" element={<ProductDetail />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="login" element={<Login />} />
            <Route path="account" element={<Account />} />
            <Route path="signals" element={<Signals />} />
            <Route path="*" element={<p>Page not found.</p>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
