import { Link, Outlet } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ListItem } from "@/components/ui/list-item";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
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
                    <Link to="/">Início</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Campeonatos</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                      <ListItem href="/campeonatos" title="Organizando">
                        Você Organiza ou Gerencia
                      </ListItem>
                      <ListItem href="/campeonatos" title="Participando">
                        Você está Inscrito como Piloto
                      </ListItem>
                      <ListItem href="/campeonatos" title="Buscar Campeonatos">
                        Procure e Participe de Campeonatos
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/30 hover:text-accent-foreground focus:bg-accent/30 focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                    asChild
                  >
                    <Link to="/calendario">Calendário</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Menu para Mobile */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none hidden md:flex">
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarFallback className="text-foreground">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">John Doe</span>
                  <ChevronDown
                    className="h-4 w-4 transition duration-300 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/perfil">Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/plano">Plano</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ajuda">Ajuda</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/sair">Sair</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
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
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">John Doe</span>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <Link
                      to="/"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Início
                    </Link>
                    <Link
                      to="/campeonatos"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Organizando
                    </Link>
                    <Link
                      to="/campeonatos"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Participando
                    </Link>
                    <Link
                      to="/campeonatos"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Buscar Campeonatos
                    </Link>
                    <Link
                      to="/calendario"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Calendário
                    </Link>
                    <div className="h-px bg-border my-2" />
                    <Link
                      to="/perfil"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Perfil
                    </Link>
                    <Link
                      to="/plano"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Plano
                    </Link>
                    <Link
                      to="/ajuda"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Ajuda
                    </Link>
                    <div className="h-px bg-border my-2" />
                    <Link
                      to="/sair"
                      className="px-2 py-1 rounded-md hover:bg-accent/50 transition-colors text-destructive"
                      onClick={() => setIsOpen(false)}
                    >
                      Sair
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-muted py-4 px-6">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} BRK. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
