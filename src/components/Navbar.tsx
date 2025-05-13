import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import { Link, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Flag, Menu, X, Trophy, Info, Users, MapPin, User } from "lucide-react"
import { useClub, CLUBS } from "@/contexts/ClubContext"
import { useState, useRef, useEffect, ChangeEvent } from "react"
import { SearchInput } from "./ui/input"
import { Card, CardContent } from "./ui/card"
import pilotsData from "@/data/pilots.json"
import { getInitials } from "@/utils/pilot-utils"

const APP_URL = import.meta.env.VITE_APP_URL

export function Navbar() {
  const navigate = useNavigate()
  const { selectClub, selectedClub } = useClub()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showEmptyMessage, setShowEmptyMessage] = useState(false)
  
  // Estados para a pesquisa de pilotos
  const [pilotSearchQuery, setPilotSearchQuery] = useState("")
  const [pilotDropdownOpen, setPilotDropdownOpen] = useState(false)
  const pilotSearchInputRef = useRef<HTMLInputElement>(null)
  const [showPilotEmptyMessage, setShowPilotEmptyMessage] = useState(false)

  const handleClubSelect = (club: typeof CLUBS[0]) => {
    selectClub(club)
    setMobileMenuOpen(false)
    setDropdownOpen(false)
    setSearchQuery("")
  }
  
  const handlePilotSelect = (pilot: typeof pilotsData[0]) => {
    setPilotDropdownOpen(false)
    setMobileMenuOpen(false)
    setPilotSearchQuery("")
    navigate(`/pilotos/${pilot.slug}`)
  }

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Handle search input change
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    // Reset empty message timer on each input change
    setShowEmptyMessage(false)
    if (e.target.value && filteredClubs.length === 0) {
      // Show empty message after slight delay
      setTimeout(() => setShowEmptyMessage(true), 300)
    }
  }

  // Clear search input
  const clearSearch = () => {
    setSearchQuery("")
    setShowEmptyMessage(false)
  }
  
  // Handle pilot search input change
  const handlePilotSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPilotSearchQuery(e.target.value)
    // Reset empty message timer on each input change
    setShowPilotEmptyMessage(false)
    if (e.target.value.length >= 2 && filteredPilots.length === 0) {
      // Show empty message after slight delay
      setTimeout(() => setShowPilotEmptyMessage(true), 300)
    }
  }

  // Clear pilot search input
  const clearPilotSearch = () => {
    setPilotSearchQuery("")
    setShowPilotEmptyMessage(false)
  }

  // Filter clubs based on search query
  const filteredClubs = CLUBS.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    club.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.location.state.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Filter pilots based on search query
  const filteredPilots = pilotSearchQuery.length >= 2 
    ? pilotsData
        .filter(pilot => 
          pilot.name.toLowerCase().includes(pilotSearchQuery.toLowerCase()) || 
          (pilot.nickname && pilot.nickname.toLowerCase().includes(pilotSearchQuery.toLowerCase())) ||
          pilot.category.toLowerCase().includes(pilotSearchQuery.toLowerCase()) ||
          (`#${pilot.number}`.includes(pilotSearchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : []

  // Suggested clubs to make the interface more helpful
  const suggestedClubs = searchQuery.length === 0 ? CLUBS.slice(0, 5) : []

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [dropdownOpen])
  
  // Focus pilot search input when dropdown opens
  useEffect(() => {
    if (pilotDropdownOpen && pilotSearchInputRef.current) {
      setTimeout(() => {
        pilotSearchInputRef.current?.focus()
      }, 100)
    }
  }, [pilotDropdownOpen])

  return (
    <nav className="border-b bg-background relative z-20">
      <div className="container px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo-brk.svg" alt="BRK Logo" className="h-6 w-auto" />
          </Link>

          {/* Desktop club dropdown */}
          <div className="hidden md:flex items-center space-x-4">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary-500 transition-all duration-200 ease-in-out"
                >
                  <Flag className="h-4 w-4" />
                  {selectedClub ? (
                    <span className="flex items-center">
                      {selectedClub.name}
                      <ChevronDown className="h-4 w-4 ml-1 transition-transform duration-200" 
                        style={{ transform: dropdownOpen ? 'rotate(-180deg)' : 'rotate(0)' }}
                      />
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Descubra um Clube
                      <ChevronDown className="h-4 w-4 ml-1 transition-transform duration-200" 
                        style={{ transform: dropdownOpen ? 'rotate(-180deg)' : 'rotate(0)' }}
                      />
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-[350px] p-4">
                <div className="sticky top-0 bg-background pt-1 space-y-3">
                  <div className="text-sm font-medium">Encontre o melhor clube para você</div>
                  <SearchInput
                    ref={searchInputRef}
                    placeholder="Digite o nome do clube ou cidade..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    clearable={!!searchQuery}
                    onClear={clearSearch}
                    variant="muted"
                    inputSize="default"
                    className="rounded-lg transition-all focus-visible:ring-primary-500/20 focus-visible:border-primary-500/50"
                  />
                  {searchQuery && (
                    <div className="text-xs text-muted-foreground">
                      {filteredClubs.length} {filteredClubs.length === 1 ? 'clube encontrado' : 'clubes encontrados'}
                    </div>
                  )}
                </div>
                
                <div className="max-h-[50vh] overflow-y-auto mt-3 pr-1">
                  {searchQuery ? (
                    filteredClubs.length === 0 && showEmptyMessage ? (
                      <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                        <Info className="h-10 w-10 text-muted-foreground/50" />
                        <div>
                          <p className="font-medium">Nenhum clube encontrado</p>
                          <p className="text-sm text-muted-foreground mt-1">Tente outro termo ou explore os clubes disponíveis</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={clearSearch}
                        >
                          Ver todos os clubes
                        </Button>
                      </div>
                    ) : (
                      filteredClubs.map((club) => (
                        <Card 
                          key={club.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 border-muted/80 mb-2"
                          onClick={() => handleClubSelect(club)}
                        >
                          <CardContent className="p-3 flex items-start space-x-3">
                            <div className="bg-primary-500/10 rounded-lg p-2 text-primary-500">
                              <Trophy className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{club.name}</div>
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {club.location.city}, {club.location.state}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )
                  ) : (
                    <div className="space-y-4">
                      <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mt-2">
                        Clubes em destaque
                      </div>
                      {suggestedClubs.map((club) => (
                        <Card 
                          key={club.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 border-muted/80 mb-2"
                          onClick={() => handleClubSelect(club)}
                        >
                          <CardContent className="p-3 flex items-start space-x-3">
                            <div className="bg-primary-500/10 rounded-lg p-2 text-primary-500">
                              <Trophy className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{club.name}</div>
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3 mr-1" />
                                {club.location.city}, {club.location.state}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <div className="pt-2 pb-1 text-center">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-xs text-primary-500"
                          asChild
                        >
                          <Link to="/clubes" onClick={() => {
                            setDropdownOpen(false);
                            setMobileMenuOpen(false);
                          }}>
                            <Users className="h-3 w-3 mr-1" />
                            Ver todos os clubes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Desktop pilots dropdown */}
            <DropdownMenu open={pilotDropdownOpen} onOpenChange={setPilotDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary-500 transition-all duration-200 ease-in-out"
                >
                  <User className="h-4 w-4" />
                  <span className="flex items-center">
                    Pilotos
                    <ChevronDown className="h-4 w-4 ml-1 transition-transform duration-200" 
                      style={{ transform: pilotDropdownOpen ? 'rotate(-180deg)' : 'rotate(0)' }}
                    />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-[350px] p-4">
                <div className="sticky top-0 bg-background pt-1 space-y-3">
                  <div className="text-sm font-medium">Buscar pilotos</div>
                  <SearchInput
                    ref={pilotSearchInputRef}
                    placeholder="Digite o nome, número ou categoria..."
                    value={pilotSearchQuery}
                    onChange={handlePilotSearchChange}
                    clearable={!!pilotSearchQuery}
                    onClear={clearPilotSearch}
                    variant="muted"
                    inputSize="default"
                    className="rounded-lg transition-all focus-visible:ring-primary-500/20 focus-visible:border-primary-500/50"
                  />
                  {pilotSearchQuery && (
                    <div className="text-xs text-muted-foreground">
                      {filteredPilots.length} {filteredPilots.length === 1 ? 'piloto encontrado' : 'pilotos encontrados'}
                    </div>
                  )}
                </div>
                
                <div className="max-h-[50vh] overflow-y-auto mt-3 pr-1">
                  {pilotSearchQuery ? (
                    filteredPilots.length === 0 && showPilotEmptyMessage ? (
                      <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                        <Info className="h-8 w-8 text-muted-foreground/50" />
                        <div>
                          <p className="font-medium text-sm">Nenhum piloto encontrado</p>
                          <p className="text-xs text-muted-foreground mt-1">Tente outro termo ou explore os pilotos disponíveis</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={clearPilotSearch}
                        >
                          Ver todos os pilotos
                        </Button>
                      </div>
                    ) : pilotSearchQuery.length === 1 ? (
                      <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                        <User className="h-8 w-8 mb-2 text-muted-foreground/50" />
                        <p className="font-medium text-sm text-foreground mb-1">Continue digitando...</p>
                        <p className="text-xs">A pesquisa começa a partir da segunda letra</p>
                      </div>
                    ) : filteredPilots.length > 0 ? (
                      filteredPilots.map((pilot) => (
                        <Card 
                          key={pilot.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 border-muted/80 mb-2"
                          onClick={() => handlePilotSelect(pilot)}
                        >
                          <CardContent className="p-3 flex items-start space-x-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-500/30 flex items-center justify-center bg-muted text-primary-500">
                              {pilot.avatar_url ? (
                                <img 
                                  src={pilot.avatar_url} 
                                  alt={pilot.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold">{getInitials(pilot.name)}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{pilot.name}</div>
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <span className="bg-primary-500/10 text-primary-500 px-1 py-0.5 rounded text-xs mr-2">
                                  #{pilot.number}
                                </span>
                                {pilot.category}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                        <User className="h-8 w-8 mb-2 text-muted-foreground/50" />
                        <p className="font-medium text-sm text-foreground mb-1">Digite para buscar pilotos</p>
                        <p className="text-xs">A pesquisa começa a partir da segunda letra</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                      <User className="h-8 w-8 mb-2 text-muted-foreground/50" />
                      <p className="font-medium text-sm text-foreground mb-1">Digite para buscar pilotos</p>
                      <p className="text-xs">A pesquisa começa a partir da segunda letra</p>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary-500"
              asChild
            >
              <a href={`${APP_URL}/login`}>
                Entrar
              </a>
            </Button>
            <Button
              className="bg-primary-500 text-white hover:bg-primary-600"
              asChild
            >
              <a href={`${APP_URL}/signup`}>
                Faça parte
              </a>
            </Button>
          </div>
          <ModeToggle />
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center md:hidden z-30">
          <ModeToggle />
          <Button 
            variant="ghost" 
            size="icon"
            type="button" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            className="ml-2 relative"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu overlay to prevent clicks underneath */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile menu */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-xs bg-background border-l shadow-xl z-20 transform transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-16 border-b flex items-center justify-between px-4">
          <h2 className="font-medium flex items-center">
            <Flag className="h-4 w-4 mr-2 text-primary-500" />
            Menu
          </h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMobileMenu}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
          {/* Clube search */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-primary-500" />
              Encontre seu clube
            </h3>
            
            <SearchInput
              placeholder="Digite o nome do clube ou cidade..."
              value={searchQuery}
              onChange={handleSearchChange}
              clearable={!!searchQuery}
              onClear={clearSearch}
              variant="muted"
              inputSize="default"
            />
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {searchQuery ? (
                filteredClubs.length === 0 && showEmptyMessage ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                    <Info className="h-8 w-8 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium text-sm">Nenhum clube encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1">Tente outro termo ou explore os clubes disponíveis</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      asChild
                    >
                      <Link to="/clubes" onClick={() => {
                        setDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}>
                        Ver todos os clubes
                      </Link>
                    </Button>
                  </div>
                ) : (
                  filteredClubs.map((club) => (
                    <Card 
                      key={club.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 border-muted/80"
                      onClick={() => handleClubSelect(club)}
                    >
                      <CardContent className="p-3 flex items-start space-x-3">
                        <div className="bg-primary-500/10 rounded-lg p-2 text-primary-500">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{club.name}</div>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {club.location.city}, {club.location.state}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )
              ) : (
                <div className="space-y-3">
                  <div className="text-xs uppercase font-medium text-muted-foreground tracking-wider mt-2">
                    Clubes em destaque
                  </div>
                  {suggestedClubs.map((club) => (
                    <Card 
                      key={club.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 border-muted/80"
                      onClick={() => handleClubSelect(club)}
                    >
                      <CardContent className="p-3 flex items-start space-x-3">
                        <div className="bg-primary-500/10 rounded-lg p-2 text-primary-500">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{club.name}</div>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {club.location.city}, {club.location.state}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    asChild
                  >
                    <Link to="/clubes" onClick={() => {
                      setDropdownOpen(false);
                      setMobileMenuOpen(false);
                    }}>
                      <Users className="h-4 w-4 mr-2" />
                      Ver todos os clubes
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Pilots search */}
          <div className="space-y-3 mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-primary-500" />
              Buscar pilotos
            </h3>
            
            <SearchInput
              placeholder="Digite o nome, número ou categoria..."
              value={pilotSearchQuery}
              onChange={handlePilotSearchChange}
              clearable={!!pilotSearchQuery}
              onClear={clearPilotSearch}
              variant="muted"
              inputSize="default"
            />
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {pilotSearchQuery ? (
                filteredPilots.length === 0 && showPilotEmptyMessage ? (
                  <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                    <Info className="h-8 w-8 text-muted-foreground/50" />
                    <div>
                      <p className="font-medium text-sm">Nenhum piloto encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1">Tente outro termo ou explore os pilotos disponíveis</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={clearPilotSearch}
                    >
                      Ver todos os pilotos
                    </Button>
                  </div>
                ) : pilotSearchQuery.length === 1 ? (
                  <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                    <User className="h-8 w-8 mb-2 text-muted-foreground/50" />
                    <p className="font-medium text-sm text-foreground mb-1">Continue digitando...</p>
                    <p className="text-xs">A pesquisa começa a partir da segunda letra</p>
                  </div>
                ) : filteredPilots.length > 0 ? (
                  filteredPilots.map((pilot) => (
                    <Card 
                      key={pilot.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors duration-200 border-muted/80 mb-2"
                      onClick={() => handlePilotSelect(pilot)}
                    >
                      <CardContent className="p-3 flex items-start space-x-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary-500/30 flex items-center justify-center bg-muted text-primary-500">
                          {pilot.avatar_url ? (
                            <img 
                              src={pilot.avatar_url} 
                              alt={pilot.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold">{getInitials(pilot.name)}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{pilot.name}</div>
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <span className="bg-primary-500/10 text-primary-500 px-1 py-0.5 rounded text-xs mr-2">
                              #{pilot.number}
                            </span>
                            {pilot.category}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                    <User className="h-8 w-8 mb-2 text-muted-foreground/50" />
                    <p className="font-medium text-sm text-foreground mb-1">Digite para buscar pilotos</p>
                    <p className="text-xs">A pesquisa começa a partir da segunda letra</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                  <User className="h-8 w-8 mb-2 text-muted-foreground/50" />
                  <p className="font-medium text-sm text-foreground mb-1">Digite para buscar pilotos</p>
                  <p className="text-xs">A pesquisa começa a partir da segunda letra</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-3 border-t space-y-3">
            <h3 className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary-500" />
              Sua conta
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a href={`${APP_URL}/login`}>
                  Entrar
                </a>
              </Button>
              <Button
                className="w-full bg-primary-500 text-white hover:bg-primary-600"
                asChild
              >
                <a href={`${APP_URL}/signup`}>
                Faça parte
                </a>
              </Button>
            </div>
          </div>
          
          {selectedClub && (
            <div className="pt-3 border-t space-y-3">
              <h3 className="text-sm font-medium flex items-center">
                <Flag className="h-4 w-4 mr-2 text-primary-500" />
                Clube atual
              </h3>
              <Card className="border-primary-500/30 bg-primary-500/5">
                <CardContent className="p-3">
                  <div className="font-medium">{selectedClub.name}</div>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {selectedClub.location.city}, {selectedClub.location.state}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 