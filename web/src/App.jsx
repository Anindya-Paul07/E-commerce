import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from '@/layout/rootlayout'
import Home from '@/pages/home'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Product from '@/pages/product'

import AdminLayout from '@/layout/adminlayout'
import Dashboard from '@/pages/admin/dashboard'
import AdminProducts from '@/pages/admin/product'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
