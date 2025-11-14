import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Materiais = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string | null>(null);

  const { data: materiais = [], isLoading } = useQuery({
    queryKey: ['materiais'],
    queryFn: async () => {
      const { data } = await supabase
        .from('materiais')
        .select('*')
        .eq('publico', true)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const categorias = Array.from(new Set(materiais.map(m => m.categoria).filter(Boolean)));

  const materiaisFiltrados = materiais.filter(material => {
    const matchSearch = material.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !categoriaFilter || material.categoria === categoriaFilter;
    return matchSearch && matchCategoria;
  });

  const handleDownload = async (material: { id: string; downloads: number }) => {
    await supabase
      .from('materiais')
      .update({ downloads: material.downloads + 1 })
      .eq('id', material.id);
    
    toast.success('Material baixado com sucesso!');
  };

  const getTipoIcon = (tipo: string) => {
    return <FileText className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-serif font-bold">Portal de Recursos</h1>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar materiais..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={categoriaFilter === null ? 'default' : 'outline'}
                    onClick={() => setCategoriaFilter(null)}
                    size="sm"
                  >
                    Todos
                  </Button>
                  {categorias.map((cat) => (
                    <Button
                      key={cat}
                      variant={categoriaFilter === cat ? 'default' : 'outline'}
                      onClick={() => setCategoriaFilter(cat as string)}
                      size="sm"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materiaisFiltrados.map((material) => (
              <Card key={material.id} className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getTipoIcon(material.tipo)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{material.titulo}</CardTitle>
                      {material.categoria && (
                        <Badge variant="secondary" className="mt-2">
                          {material.categoria}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {material.tags && material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {material.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{material.downloads} downloads</span>
                    <span className="uppercase">{material.tipo}</span>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => handleDownload(material)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {materiaisFiltrados.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum material encontrado</p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Materiais;
