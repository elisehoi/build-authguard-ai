import { notFound } from 'next/navigation'

// Unknown addresses inside this product show its own not-found page, not the root one.
export default function Missing() {
  notFound()
}
