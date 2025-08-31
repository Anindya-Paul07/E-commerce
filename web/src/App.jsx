import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from '@/layout/rootlayout'
import Home from '@/pages/home'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Product from '@/pages/product'
import CategoryPage from '@/pages/category'
import Cart from '@/pages/cart'

import AdminLayout from '@/layout/adminlayout'
import Dashboard from '@/pages/admin/dashboard'
import AdminProducts from '@/pages/admin/product'
import AdminCategory from '@/pages/admin/category'
import AdminOrdersPage from '@/pages/admin/order'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path='/cart' element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategory />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
