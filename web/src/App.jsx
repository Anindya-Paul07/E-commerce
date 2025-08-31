import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from '@/layout/rootlayout'
import Home from '@/pages/home'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Product from '@/pages/product'
import CategoryPage from '@/pages/category'


import AdminLayout from '@/layout/adminlayout'
import Dashboard from '@/pages/admin/dashboard'
import AdminProducts from '@/pages/admin/product'
import AdminCategory from '@/pages/admin/category'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
