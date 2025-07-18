import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'brk-design-system';
import { Input } from 'brk-design-system';
import { Card, CardContent, CardHeader, CardTitle } from 'brk-design-system';
import { Badge } from 'brk-design-system';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'brk-design-system';
import { Trash2, Plus, Globe, Building2, Edit, Star, Heart } from 'lucide-react';
import { Sponsor } from '@/lib/services/championship.service';
import { FileUpload } from '@/components/ui/file-upload';
import { useIsMobile } from '@/hooks/use-mobile';

interface SponsorListFieldProps {
  value?: Sponsor[];
  onChange: (sponsors: Sponsor[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface SponsorFormData {
  name: string;
  logoImage: string;
  website: string;
  type: 'sponsor' | 'supporter';
}

export const SponsorListField: React.FC<SponsorListFieldProps> = ({
  value = [],
  onChange,
  disabled = false,
  placeholder = "Adicione patrocinadores ao seu campeonato"
}) => {
  const isMobile = useIsMobile();
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<SponsorFormData>({
    name: '',
    logoImage: '',
    website: '',
    type: 'sponsor'
  });
  const formRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      logoImage: '',
      website: '',
      type: 'sponsor'
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      logoImage: '',
      website: '',
      type: 'sponsor'
    });
  };

  const handleEdit = (index: number) => {
    const sponsor = value[index];
    setEditingIndex(index);
    setFormData({
      name: sponsor.name,
      logoImage: sponsor.logoImage,
      website: sponsor.website || '',
      type: sponsor.type
    });
    setIsAdding(true);
  };

  // Scroll to form when editing starts
  useEffect(() => {
    if (isAdding && editingIndex !== null && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [isAdding, editingIndex]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.logoImage.trim()) {
      return;
    }

    const newSponsor: Omit<Sponsor, 'id'> & { id?: string } = {
      name: formData.name.trim(),
      logoImage: formData.logoImage.trim(),
      website: formData.website.trim() || undefined,
      type: formData.type
    };

    let updatedSponsors: Sponsor[];

    if (editingIndex !== null) {
      // Editing existing sponsor
      updatedSponsors = [...value];
      updatedSponsors[editingIndex] = {
        ...updatedSponsors[editingIndex],
        ...newSponsor
      };
    } else {
      // Adding new sponsor
      updatedSponsors = [...value, newSponsor as Sponsor];
    }

    onChange(updatedSponsors);
    resetForm();
  };

  const handleRemove = (index: number) => {
    const updatedSponsors = value.filter((_, i) => i !== index);
    onChange(updatedSponsors);
  };

  const getTypeBadge = (type: 'sponsor' | 'supporter') => {
    if (type === 'sponsor') {
      return (
        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
          <Star className="w-3 h-3 mr-1" />
          Patrocinador
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
          <Heart className="w-3 h-3 mr-1" />
          Apoiador
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Sponsors */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Patrocinadores e Apoiadores ({value.length})</h4>
          {value.map((sponsor, index) => (
            <Card key={sponsor.id || `temp-${index}`} className={`${isMobile ? 'p-6' : 'p-4'}`}>
              {isMobile ? (
                // Layout Mobile: Logo em cima, informações embaixo
                <div className="space-y-4">
                  {/* Logo em cima */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      {sponsor.logoImage ? (
                        <img 
                          src={sponsor.logoImage} 
                          alt={sponsor.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = target.nextElementSibling as HTMLElement;
                            target.style.display = 'none';
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <Building2 className="w-10 h-10 text-muted-foreground" style={{ display: sponsor.logoImage ? 'none' : 'flex' }} />
                    </div>
                  </div>
                  
                  {/* Informações do patrocinador */}
                  <div className="text-center space-y-3">
                    <h5 className="font-semibold text-lg">{sponsor.name}</h5>
                    <div className="flex items-center justify-center space-x-2">
                      {getTypeBadge(sponsor.type)}
                      {sponsor.website && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Website
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Botões de ação */}
                  <div className="flex items-center justify-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(index)}
                      disabled={disabled}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </div>
              ) : (
                // Layout Desktop: Mantém o layout original
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {sponsor.logoImage ? (
                        <img 
                          src={sponsor.logoImage} 
                          alt={sponsor.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback = target.nextElementSibling as HTMLElement;
                            target.style.display = 'none';
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <Building2 className="w-6 h-6 text-muted-foreground" style={{ display: sponsor.logoImage ? 'none' : 'flex' }} />
                    </div>
                    
                    <div className="flex-1">
                      <h5 className="font-medium">{sponsor.name}</h5>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTypeBadge(sponsor.type)}
                        {sponsor.website && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Website
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(index)}
                      disabled={disabled}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding ? (
        <Card ref={formRef}>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingIndex !== null ? 'Editar Patrocinador/Apoiador' : 'Adicionar Patrocinador/Apoiador'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Empresa ABC Ltda"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Tipo <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.type}
                onValueChange={(value: 'sponsor' | 'supporter') => setFormData(prev => ({ ...prev, type: value }))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sponsor">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2" />
                      Patrocinador
                    </div>
                  </SelectItem>
                  <SelectItem value="supporter">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Apoiador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <FileUpload
                value={formData.logoImage}
                onChange={(url) => setFormData(prev => ({ ...prev, logoImage: url }))}
                disabled={disabled}
                placeholder="Faça upload da logo ou insira uma URL"
                accept="image/*"
                maxSize={5}
                label="Logo *"
                showPreview={true}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Website (opcional)</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.empresa.com.br"
                type="url"
                disabled={disabled}
              />
            </div>

            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-end space-x-2'}`}>
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={disabled}
                className={isMobile ? 'w-full' : ''}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={disabled || !formData.name.trim() || !formData.logoImage.trim()}
                className={isMobile ? 'w-full' : ''}
              >
                {editingIndex !== null ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Add Button */
        <Button
          variant="outline"
          onClick={handleAdd}
          disabled={disabled}
          className="w-full"
        >
          Adicionar Patrocinador/Apoiador
        </Button>
      )}

      {value.length === 0 && !isAdding && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{placeholder}</p>
        </div>
      )}
    </div>
  );
}; 