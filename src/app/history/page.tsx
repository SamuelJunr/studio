
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInSeconds } from 'date-fns';
import { ArrowLeft, ListFilter, Eye } from 'lucide-react';
import * as storageService from '@/lib/storageService';
import type { TestRun } from '@/lib/types';

interface FilterSummary {
  filterName: string;
  count: number;
}

export default function HistoryPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [filterSummary, setFilterSummary] = useState<FilterSummary[]>([]);

  useEffect(() => {
    const loadedTestRuns = storageService.getTestRuns().sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Sort by newest first
    setTestRuns(loadedTestRuns);

    const summary: { [key: string]: number } = {};
    loadedTestRuns.forEach(run => {
      summary[run.filterName] = (summary[run.filterName] || 0) + 1;
    });
    setFilterSummary(Object.entries(summary).map(([name, count]) => ({ filterName: name, count })));
  }, []);

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
        return `Definido: ${minutes}m ${seconds}s`;
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

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary flex items-center">
            <ListFilter className="w-8 h-8 mr-3" /> Histórico de Ensaios
          </h1>
          <Link href="/dashboard" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
        <p className="text-foreground/80">Visualize o resumo e o histórico de todos os ensaios realizados.</p>
      </header>

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle>Sumário por Tipo de Filtragem</CardTitle>
        </CardHeader>
        <CardContent>
          {filterSummary.length > 0 ? (
            <ul className="space-y-2">
              {filterSummary.map(summary => (
                <li key={summary.filterName} className="flex justify-between p-2 bg-muted/30 rounded-md">
                  <span>{summary.filterName}</span>
                  <span className="font-semibold">{summary.count} ensaio(s)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-foreground/70">Nenhum ensaio realizado ainda.</p>
          )}
        </CardContent>
      </Card>

      <Card className="flex-grow shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes dos Ensaios</CardTitle>
          <CardDescription>Lista de todos os ensaios registrados, do mais recente para o mais antigo.</CardDescription>
        </CardHeader>
        <CardContent>
          {testRuns.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Ensaio</TableHead>
                    <TableHead>Filtragem</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dados Coletados</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testRuns.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-xs">{run.id.substring(0,8)}...</TableCell>
                      <TableCell>{run.filterName}</TableCell>
                      <TableCell>{format(new Date(run.startTime), 'dd/MM/yy HH:mm:ss')}</TableCell>
                      <TableCell>{run.endTime ? format(new Date(run.endTime), 'dd/MM/yy HH:mm:ss') : '-'}</TableCell>
                      <TableCell>{getTestDuration(run)}</TableCell>
                      <TableCell>{getStatusText(run.status)}</TableCell>
                      <TableCell>{run.loggedData.length}</TableCell>
                      <TableCell>
                        <Link href={`/reports/${run.id}`} passHref>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" /> Ver Relatório
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-center text-foreground/70 py-8">Nenhum ensaio registrado para exibir.</p>
          )}
        </CardContent>
      </Card>
      <footer className="mt-12 text-center text-foreground/70 text-sm">
        <p>&copy; {new Date().getFullYear()} MINAS TESTE SOLUÇÕES. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
