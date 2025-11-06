import Navbar from '@/components/navbar'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { Outlet } from 'react-router-dom'

export default function RootLayout() {
  return (
    <>
      <Navbar />
      <Header />
      <main className="bg-background py-8">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
