export default function Footer() {
  return (
    <footer style={{ borderTop:'1px solid #eee', marginTop:32 }}>
      <div style={{ maxWidth:960, margin:'0 auto', padding:'16px', color:'#666' }}>
        <small>© {new Date().getFullYear()} E-Commerce. All rights reserved.</small>
      </div>
    </footer>
  )
}
