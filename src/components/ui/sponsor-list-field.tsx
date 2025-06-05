import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Globe, Building2 } from 'lucide-react';
import { Sponsor } from '@/lib/services/championship.service';
import { FileUpload } from '@/components/ui/file-upload';

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
}

export const SponsorListField: React.FC<SponsorListFieldProps> = ({
  value = [],
  onChange,
  disabled = false,
  placeholder = "Adicione patrocinadores ao seu campeonato"
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<SponsorFormData>({
    name: '',
    logoImage: '',
    website: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      logoImage: '',
      website: ''
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      logoImage: '',
      website: ''
    });
  };

  const handleEdit = (index: number) => {
    const sponsor = value[index];
    setEditingIndex(index);
    setFormData({
      name: sponsor.name,
      logoImage: sponsor.logoImage,
      website: sponsor.website || ''
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.logoImage.trim()) {
      return;
    }

    const newSponsor: Sponsor = {
      id: '', // ID será gerado pelo backend
      name: formData.name.trim(),
      logoImage: formData.logoImage.trim(),
      website: formData.website.trim() || undefined
    };

    let updatedSponsors: Sponsor[];

    if (editingIndex !== null) {
      // Editing existing sponsor
      updatedSponsors = [...value];
      updatedSponsors[editingIndex] = {
        ...updatedSponsors[editingIndex],
        name: newSponsor.name,
        logoImage: newSponsor.logoImage,
        website: newSponsor.website
      };
    } else {
      // Adding new sponsor
      updatedSponsors = [...value, newSponsor];
    }

    onChange(updatedSponsors);
    resetForm();
  };

  const handleRemove = (index: number) => {
    const updatedSponsors = value.filter((_, i) => i !== index);
    onChange(updatedSponsors);
  };

  return (
    <div className="space-y-4">
      {/* Existing Sponsors */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Patrocinadores Adicionados ({value.length})</h4>
          {value.map((sponsor, index) => (
            <Card key={sponsor.id || `temp-${index}`} className="p-4">
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
                    Editar
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
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingIndex !== null ? 'Editar Patrocinador' : 'Adicionar Patrocinador'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Nome do Patrocinador <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Empresa ABC Ltda"
                disabled={disabled}
              />
            </div>

            <div>
              <FileUpload
                value={formData.logoImage}
                onChange={(url) => setFormData(prev => ({ ...prev, logoImage: url }))}
                disabled={disabled}
                placeholder="Faça upload da logo ou insira uma URL"
                accept="image/*"
                maxSize={5}
                label="Logo do Patrocinador *"
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

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={disabled}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={disabled || !formData.name.trim() || !formData.logoImage.trim()}
              >
                {editingIndex !== null ? 'Salvar Alterações' : 'Adicionar Patrocinador'}
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
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Patrocinador
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