import { Instagram, MessageCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Link } from "react-router-dom"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo-brk.svg" alt="BRK Logo" className="h-5 w-auto" />
          </Link>
          <span className="text-sm text-muted-foreground">Brasil Rental Karts</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary-500 transition-colors"
            >
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </a>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 rounded-full border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
            asChild
          >
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Contato</span>
            </a>
          </Button>
        </div>
      </div>
    </footer>
  )
} 