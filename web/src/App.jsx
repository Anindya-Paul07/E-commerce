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
import AdminBrands from '@/pages/admin/brand'
import AdminOrdersPage from '@/pages/admin/order'
import AdminWarehouses from '@/pages/admin/warehouse'
import AdminInventory from '@/pages/admin/inventory'

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
          <Route path="/admin/brands" element={<AdminBrands />} />
          <Route path="/admin/categories" element={<AdminCategory />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/warehouses" element={<AdminWarehouses />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
