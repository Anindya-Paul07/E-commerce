import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, Package, Tag } from 'lucide-react'
import { api } from '@/lib/api'

const MIN_QUERY_LENGTH = 2

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ products: [], categories: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults({ products: [], categories: [] })
      setError('')
      setOpen(false)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        const data = await api.get(`/search?q=${encodeURIComponent(query.trim())}&limit=5`, { signal: controller.signal })
        setResults({
          products: data.products || [],
          categories: data.categories || [],
        })
        setOpen(true)
      } catch (e) {
        if (controller.signal.aborted) return
        setError(e.message || 'Search failed')
        setOpen(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [query])

  useEffect(() => {
    function handleClick(event) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  function goToProduct(slug) {
    setOpen(false)
    setQuery('')
    navigate(`/product/${slug}`)
  }

  function goToCategory(slug) {
    setOpen(false)
    setQuery('')
    navigate(`/category/${slug}`)
  }

  const showEmptyState = !loading && !error && results.products.length === 0 && results.categories.length === 0 && query.trim().length >= MIN_QUERY_LENGTH

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products or categories"
          className="h-10 w-full rounded-full border border-border bg-secondary/60 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Search"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border bg-card shadow-lg">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {!error && (
            <div className="divide-y">
              <div>
                <p className="px-4 pt-3 text-xs font-medium uppercase text-muted-foreground">Products</p>
                {results.products.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No matching products.</p>
                ) : (
                  <ul className="max-h-60 overflow-auto py-1 text-sm">
                    {results.products.map((product) => (
                      <li key={product._id}>
                        <button
                          type="button"
                          onClick={() => goToProduct(product.slug || product._id)}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted"
                        >
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{product.title}</div>
                            <div className="text-xs text-muted-foreground">${Number(product.price).toFixed(2)}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="px-4 pt-3 text-xs font-medium uppercase text-muted-foreground">Categories</p>
                {results.categories.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No matching categories.</p>
                ) : (
                  <ul className="max-h-48 overflow-auto py-1 text-sm">
                    {results.categories.map((category) => (
                      <li key={category._id}>
                        <button
                          type="button"
                          onClick={() => goToCategory(category.slug || category._id)}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted"
                        >
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-muted-foreground truncate">{category.description}</div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {showEmptyState && (
            <div className="px-4 py-3 text-sm text-muted-foreground">No results for “{query.trim()}”.</div>
          )}
        </div>
      )}
    </div>
  )
}
