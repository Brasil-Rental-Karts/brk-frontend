import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between">
            <div className="text-2xl font-bold">BRK</div>
            <div className="space-x-4">
              <a href="/" className="hover:text-primary transition-colors">Home</a>
              <a href="/leagues" className="hover:text-primary transition-colors">Leagues</a>
              <a href="/drivers" className="hover:text-primary transition-colors">Drivers</a>
              <a href="/clubs" className="hover:text-primary transition-colors">Clubs</a>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-black text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Brasil Rental Karts. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 