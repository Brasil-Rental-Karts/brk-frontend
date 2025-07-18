import { Link, Outlet } from "react-router-dom";
import { Avatar, AvatarFallback } from "brk-design-system";
import { ChevronDown, Menu, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "brk-design-system";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuIndicator,
  ListItem,
} from "brk-design-system";
import { Button } from "brk-design-system";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "brk-design-system";
import { useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ModeToggle } from "@/components/mode-toggle";

interface MainLayoutProps {
  children?: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const siteUrl = import.meta.env.VITE_SITE_URL;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-navbar-foreground py-4 px-6 shadow-md">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src="/logo-brk-marca-horizontal-black.svg"
              alt="BRK Logo"
              className="h-6 w-auto"
            />
            {/* Menu para Desktop */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/30 hover:text-accent-foreground focus:bg-accent/30 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    asChild
                  >
                    <button
                      onClick={() => {
                        navigate("/dashboard");
                      }}
                      data-navigation="/dashboard"
                    >
                      Início
                    </button>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/30 hover:text-accent-foreground focus:bg-accent/30 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    asChild
                  >
                    <button onClick={() => {
                      if ((window as any).navigateToExternal) {
                        (window as any).navigateToExternal(`${siteUrl}/campeonatos`);
                      } else {
                        window.location.href = `${siteUrl}/campeonatos`;
                      }
                    }}>Campeonatos</button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
              <NavigationMenuIndicator />
            </NavigationMenu>
          </div>

          {/* Menu para Mobile */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none hidden md:flex">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarFallback className="text-foreground">
                      {user?.name ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0,2) : (user?.email ? user.email[0].toUpperCase() : 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.name}</span>
                  <ChevronDown
                    className="h-4 w-4 transition duration-300 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <button
                    onClick={() => {
                      navigate("/dashboard");
                    }}
                    className="w-full text-left"
                    data-navigation="/dashboard"
                  >
                    Dashboard
                  </button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/financial">Financeiro</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile/edit">Perfil</Link>
                </DropdownMenuItem>
                {user?.role === 'Administrator' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Painel de Administração
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { 
                  localStorage.setItem('isLogoutAction', 'true');
                  await logout(); 
                  navigate('/'); 
                }}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <ModeToggle />

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-navbar-foreground hover:bg-primary-foreground/10"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar>
                      <AvatarFallback className="text-foreground">
                        {user?.name ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0,2) : (user?.email ? user.email[0].toUpperCase() : 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user?.name}</span>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <Link
                      to="/"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Início
                    </Link>
                    <button
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors text-left"
                      onClick={() => {
                        if ((window as any).navigateToExternal) {
                          (window as any).navigateToExternal(`${siteUrl}/campeonatos`);
                        } else {
                          window.location.href = `${siteUrl}/campeonatos`;
                        }
                        setIsOpen(false)
                      }}
                    >
                      Campeonatos
                    </button>
                    <div className="h-px bg-border my-2" />
                    <button
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors text-left w-full"
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/dashboard");
                      }}
                      data-navigation="/dashboard"
                    >
                      Dashboard
                    </button>
                    <Link
                      to="/financial"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Financeiro
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Perfil
                    </Link>
                    {user?.role === 'Administrator' && (
                      <>
                        <div className="h-px bg-border my-2" />
                        <Link
                          to="/admin"
                          className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors flex items-center gap-2"
                          onClick={() => setIsOpen(false)}
                        >
                          <Shield className="h-4 w-4" />
                          Painel de Administração
                        </Link>
                      </>
                    )}
                    <div className="h-px bg-border my-2" />
                    <button
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors text-destructive text-left"
                      onClick={async () => { 
                        setIsOpen(false); 
                        localStorage.setItem('isLogoutAction', 'true');
                        await logout(); 
                        navigate('/'); 
                      }}
                      type="button"
                    >
                      Sair
                    </button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container flex-1 px-6 py-8">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-muted py-4 px-6">
        <div className="container w-full text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} BRK. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
