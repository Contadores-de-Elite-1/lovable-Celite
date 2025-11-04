import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Clock, Award, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const Educacao = () => {
  const { user } = useAuth();

  const { data: contador } = useQuery({
    queryKey: ['contador', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contadores')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments', contador?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (titulo, duracao, nivel)
        `)
        .eq('contador_id', contador?.id);
      return data || [];
    },
    enabled: !!contador?.id
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('ativo', true);
      return data || [];
    }
  });

  const getNivelBadge = (nivel: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      'básico': { variant: 'secondary', label: 'Básico' },
      'intermediário': { variant: 'default', label: 'Intermediário' },
      'avançado': { variant: 'outline', label: 'Avançado' }
    };
    return variants[nivel] || variants['básico'];
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
          <h1 className="text-3xl font-serif font-bold">Educação</h1>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cursos Matriculados</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {enrollments.length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {enrollments.filter(e => e.status === 'concluído').length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold text-foreground">
                  {enrollments.filter(e => e.status === 'em_andamento').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {enrollments.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif">Meus Cursos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrollments.map((enrollment) => {
                    const nivelInfo = getNivelBadge(enrollment.courses?.nivel || 'básico');
                    return (
                      <Card key={enrollment.id} className="bg-muted/30 border-border">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{enrollment.courses?.titulo}</CardTitle>
                            <Badge variant={nivelInfo.variant}>{nivelInfo.label}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{enrollment.courses?.duracao} min</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-semibold">{enrollment.progresso}%</span>
                            </div>
                            <Progress value={enrollment.progresso} />
                          </div>

                          <Button className="w-full" variant={enrollment.progresso === 100 ? 'outline' : 'default'}>
                            <Play className="mr-2 h-4 w-4" />
                            {enrollment.progresso === 100 ? 'Revisar' : 'Continuar'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif">Catálogo de Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCourses
                  .filter(course => !enrollments.find(e => e.course_id === course.id))
                  .map((course) => {
                    const nivelInfo = getNivelBadge(course.nivel || 'básico');
                    return (
                      <Card key={course.id} className="bg-muted/30 border-border">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{course.titulo}</CardTitle>
                            <Badge variant={nivelInfo.variant}>{nivelInfo.label}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{course.duracao} min</span>
                          </div>
                          
                          <Button className="w-full">
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Iniciar Curso
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Educacao;
