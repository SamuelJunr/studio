
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useRouter para navegação programática
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInSeconds } from 'date-fns';
import { ArrowLeft, FileSpreadsheet, CalendarDays, Clock, Activity, BarChart3 } from 'lucide-react';
import * as storageService from '@/lib/storageService';
import type { TestRun, StoredDataPoint } from '@/lib/types';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const testRunId = typeof params.testRunId === 'string' ? params.testRunId : undefined;
  const [testRun, setTestRun] = useState<TestRun | null | undefined>(undefined); // undefined para estado inicial de carregamento

  useEffect(() => {
    if (testRunId) {
      const loadedTestRun = storageService.getTestRunById(testRunId);
      setTestRun(loadedTestRun);
    } else {
      setTestRun(null); // ID inválido ou não encontrado
    }
  }, [testRunId]);

  const getTestDuration = (run: TestRun): string => {
    if (run.endTime) {
      const duration = differenceInSeconds(new Date(run.endTime), new Date(run.startTime));
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    }
    if (run.testDurationSeconds) {
        const minutes = Math.floor(run.testDurationSeconds / 60);
        const seconds = run.testDurationSeconds % 60;
        return `Definido: ${minutes}m ${seconds}s (Status: ${run.status})`;
    }
    return 'N/A';
  };

  const getStatusText = (status: TestRun['status']): string => {
    switch (status) {
        case 'completed': return 'Concluído';
        case 'stopped': return 'Parado Manualmente';
        case 'aborted': return 'Abortado';
        case 'running': return 'Em Execução';
        default: return status;
    }
  }

  if (testRun === undefined) {
    return (
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex items-center justify-center">
            <p className="text-xl text-foreground/70">Carregando relatório...</p>
        </div>
    );
  }

  if (!testRun) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-destructive">Relatório Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">O ensaio com o ID fornecido não foi encontrado.</p>
            <Button onClick={() => router.push('/history')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Histórico
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <FileSpreadsheet className="w-8 h-8 mr-3" /> Relatório do Ensaio
          </h1>
          <Link href="/history" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Histórico
            </Button>
          </Link>
        </div>
        <p className="text-foreground/80">Detalhes do ensaio <code className="bg-muted px-1 rounded-sm text-xs">{testRun.id}</code>.</p>
      </header>

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Activity className="w-5 h-5 mr-2 text-accent" />Informações Gerais do Ensaio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div><strong>ID do Ensaio:</strong> <span className="font-mono text-xs">{testRun.id}</span></div>
          <div><strong>Tipo de Filtragem:</strong> {testRun.filterName}</div>
          <div><strong>Status:</strong> {getStatusText(testRun.status)}</div>
          <div><CalendarDays className="inline w-4 h-4 mr-1 text-muted-foreground"/><strong>Início:</strong> {format(new Date(testRun.startTime), 'dd/MM/yyyy HH:mm:ss')}</div>
          <div><CalendarDays className="inline w-4 h-4 mr-1 text-muted-foreground"/><strong>Fim:</strong> {testRun.endTime ? format(new Date(testRun.endTime), 'dd/MM/yyyy HH:mm:ss') : 'Em execução / Não finalizado'}</div>
          <div><Clock className="inline w-4 h-4 mr-1 text-muted-foreground"/><strong>Duração Efetiva:</strong> {getTestDuration(testRun)}</div>
          {testRun.testDurationSeconds && (
             <div><Clock className="inline w-4 h-4 mr-1 text-muted-foreground"/><strong>Duração Definida:</strong> {format(new Date(0).setSeconds(testRun.testDurationSeconds), 'mm:ss')} min</div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-grow shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-accent" />Dados Coletados</CardTitle>
          <CardDescription>Total de {testRun.loggedData.length} pontos de dados registrados para este ensaio.</CardDescription>
        </CardHeader>
        <CardContent>
          {testRun.loggedData.length > 0 ? (
            <ScrollArea className="h-[400px] md:h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Unidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testRun.loggedData.map((dataPoint, index) => {
                    const filter = filterOptions.find(f => f.id === dataPoint.filterId);
                    return (
                        <TableRow key={index}>
                        <TableCell>{format(new Date(dataPoint.timestamp), 'dd/MM/yy HH:mm:ss.SSS')}</TableCell>
                        <TableCell className="font-mono">{dataPoint.value.toFixed(2)}</TableCell>
                        <TableCell>{filter?.unit || 'N/A'}</TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-center text-foreground/70 py-8">Nenhum dado foi coletado para este ensaio.</p>
          )}
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-foreground/70 text-sm">
        <p>Relatório gerado em: {format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
        <p>&copy; {new Date().getFullYear()} MINAS TESTE SOLUÇÕES. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// Adicionar filterOptions aqui para que possa ser usado para encontrar a unidade
const filterOptions = [
  { id: 'index_One', name: 'Óleo Extremamente Limpo', unit: '%' },
  { id: 'index_Two', name: 'Óleo Limpo', unit: '%' },
  { id: 'index_Three', name: 'Óleo com Contaminação Moderada', unit: '%' },
  { id: 'index_Four', name: 'Óleo Contaminado', unit: '%' },
  { id: 'index_Five', name: 'Óleo Severamente Contaminado', unit: '%' },
];
