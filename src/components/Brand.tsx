import { Heart } from 'lucide-react'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <button className={`brand ${light ? 'brand--light' : ''}`} onClick={() => window.location.assign('/')}>
      <span className="brand__mark"><Heart size={14} fill="currentColor" /></span>
      <span>SUSTREND <b>SWIPE</b></span>
    </button>
  )
}
