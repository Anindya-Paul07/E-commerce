import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from './layout/rootlayout'
import Home from './pages/home'
import Login from './pages/login'
import Register from './pages/register'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
