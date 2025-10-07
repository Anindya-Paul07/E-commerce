import { useMemo, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { api } from '@/lib/api'
import { notify } from '@/lib/notify'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const EMAIL_REGEX = /.+@.+\..+/

function buildFormData(values, files) {
  const formData = new FormData()
  formData.append('displayName', values.displayName.trim())
  if (values.legalName.trim()) formData.append('legalName', values.legalName.trim())
  if (values.notes.trim()) formData.append('notes', values.notes.trim())

  const contact = {}
  if (values.contactEmail.trim()) contact.email = values.contactEmail.trim()
  if (values.contactPhone.trim()) contact.phone = values.contactPhone.trim()
  if (Object.keys(contact).length) formData.append('contact', JSON.stringify(contact))

  const shop = {}
  if (values.shopName.trim()) shop.name = values.shopName.trim()
  if (values.shopTagline.trim()) shop.tagLine = values.shopTagline.trim()
  if (Object.keys(shop).length) formData.append('shop', JSON.stringify(shop))

  if (files.shopLogo) formData.append('shopLogo', files.shopLogo)
  if (files.shopCover) formData.append('shopCover', files.shopCover)

  return formData
}

export default function SellerApplicationPage() {
  const user = useAppSelector((state) => state.session.user)
  const [values, setValues] = useState({
    displayName: '',
    legalName: '',
    contactEmail: '',
    contactPhone: '',
    shopName: '',
    shopTagline: '',
    notes: '',
  })
  const [files, setFiles] = useState({ shopLogo: null, shopCover: null })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const isLoggedIn = useMemo(() => Boolean(user), [user])

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleFileChange(event) {
    const { name, files: fileList } = event.target
    setFiles((prev) => ({ ...prev, [name]: fileList?.[0] || null }))
  }

  function validate() {
    const nextErrors = {}
    if (!values.displayName.trim()) {
      nextErrors.displayName = 'Display name is required'
    }
    if (values.contactEmail && !EMAIL_REGEX.test(values.contactEmail.trim())) {
      nextErrors.contactEmail = 'Enter a valid email address'
    }
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validate()
    if (Object.keys(validation).length) {
      setErrors(validation)
      return
    }
    setErrors({})

    try {
      setSubmitting(true)
      const formData = buildFormData(values, files)
      await api.postForm('/seller/apply', formData)
      setSuccess(true)
      notify.success('Application submitted for review')
    } catch (error) {
      const message = error.message || 'Failed to submit application'
      notify.error(message)
      setErrors({ api: message })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="container py-10">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Become a Seller</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You need an account to submit a seller application. Please sign in or register first.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Seller Application</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid gap-4"
            encType="multipart/form-data"
            noValidate
          >
            {success && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Thanks! Your application was submitted. We will review it shortly.
              </div>
            )}

            {errors.api && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {errors.api}
              </p>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="displayName">Display name *</label>
              <input
                id="displayName"
                name="displayName"
                value={values.displayName}
                onChange={handleChange}
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Acme Sellers"
                required
              />
              {errors.displayName && <p className="text-xs text-red-600">{errors.displayName}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="legalName">Legal business name</label>
              <input
                id="legalName"
                name="legalName"
                value={values.legalName}
                onChange={handleChange}
                className="h-10 rounded-md border bg-background px-3"
                placeholder="Acme Corp Ltd"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="contactEmail">Contact email</label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={values.contactEmail}
                  onChange={handleChange}
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="you@example.com"
                />
                {errors.contactEmail && <p className="text-xs text-red-600">{errors.contactEmail}</p>}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="contactPhone">Contact phone</label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  value={values.contactPhone}
                  onChange={handleChange}
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="+1 555 000 1234"
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="shopName">Shop name</label>
                <input
                  id="shopName"
                  name="shopName"
                  value={values.shopName}
                  onChange={handleChange}
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="Acme Flagship"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="shopTagline">Shop tagline</label>
                <input
                  id="shopTagline"
                  name="shopTagline"
                  value={values.shopTagline}
                  onChange={handleChange}
                  className="h-10 rounded-md border bg-background px-3"
                  placeholder="Sustainable essentials for every day"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="notes">Notes for reviewers</label>
              <textarea
                id="notes"
                name="notes"
                value={values.notes}
                onChange={handleChange}
                className="min-h-[120px] rounded-md border bg-background px-3 py-2"
                placeholder="Tell us about your catalog, fulfilment readiness, etc."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="shopLogo">Shop logo</label>
                <input
                  id="shopLogo"
                  name="shopLogo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="shopCover">Shop cover</label>
                <input
                  id="shopCover"
                  name="shopCover"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
