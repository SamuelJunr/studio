
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input'; // Importado Input
import { Label } from '@/components/ui/label'; // Importado Label
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Zap, Thermometer, Sun, Droplets, Volume2, Play, StopCircle, Download, Activity, SlidersHorizontal, Filter as FilterIcon, Settings, History, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as storageService from '@/lib/storageService';
import type { AppSession, TestRun, StoredDataPoint, LiveDataPoint } from '@/lib/types';

interface FilterOption {
  id: string;
  name: string;
  icon: LucideIcon;
  unit: string;
}

const filterOptions: FilterOption[] = [
  { id: 'index_One', name: 'Óleo Extremamente Limpo', icon: Droplets, unit: '%' },
  { id: 'index_Two', name: 'Óleo Limpo', icon: Droplets, unit: '%' },
  { id: 'index_Three', name: 'Óleo com Contaminação Moderada', icon: Droplets, unit: '%' },
  { id: 'index_Four', name: 'Óleo Contaminado', icon: Droplets, unit: '%' },
  { id: 'index_Five', name: 'Óleo Severamente Contaminado', icon: Droplets, unit: '%' },
];

const MAX_LIVE_DATA_POINTS = 10;
const DEFAULT_TEST_DURATION_SECONDS = 300; // 5 minutos
const LOGGING_INTERVAL_MS = 5000; // Loga dados no localStorage a cada 5 segundos
const LIVE_DATA_INTERVAL_MS = 1000; // Atualiza UI a cada 1 segundo

export default function DashboardPage() {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption | null>(null);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([]);
  const [currentTestRunId, setCurrentTestRunId] = useState<string | null>(null);
  const [testDuration, setTestDuration] = useState<number>(DEFAULT_TEST_DURATION_SECONDS);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const { toast } = useToast();

  const liveDataIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loggingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appSessionIdRef = useRef<string | null>(null);


  // App Session Management
  useEffect(() => {
    const sessionId = new Date().toISOString();
    appSessionIdRef.current = sessionId;
    const newSession: AppSession = {
      id: sessionId,
      startTime: sessionId,
      endTime: null,
      durationMs: null,
    };
    storageService.addAppSession(newSession);

    const handleBeforeUnload = () => {
      if (appSessionIdRef.current) {
        const session = storageService.getAppSessionById(appSessionIdRef.current);
        if (session && !session.endTime) {
            const endTime = new Date();
            const durationMs = endTime.getTime() - new Date(session.startTime).getTime();
            storageService.updateAppSession(appSessionIdRef.current, {
            endTime: endTime.toISOString(),
            durationMs: durationMs,
            });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);


  const generateMockData = useCallback((): number => {
    if (!selectedFilter) return 0;
    switch (selectedFilter.id) {
      case 'index_One': return parseFloat((Math.random() * 12 + 1).toFixed(2));
      case 'index_Two': return parseFloat((Math.random() * 15 + 13).toFixed(2));
      case 'index_Three': return parseFloat((Math.random() * 22 + 28).toFixed(2));
      case 'index_Four': return parseFloat((Math.random() * 30 + 50).toFixed(2));
      case 'index_Five': return parseFloat((Math.random() * 20 + 80).toFixed(2));
      default: return parseFloat(Math.random().toFixed(2));
    }
  }, [selectedFilter]);

  // Effect for live data stream (UI only)
  useEffect(() => {
    if (isTestRunning && selectedFilter) {
      liveDataIntervalRef.current = setInterval(() => {
        const newValue = generateMockData();
        const newLiveDataPoint: LiveDataPoint = { timestamp: new Date(), value: newValue, filterId: selectedFilter.id };
        setLiveData(prevData => [newLiveDataPoint, ...prevData.slice(0, MAX_LIVE_DATA_POINTS - 1)]);
      }, LIVE_DATA_INTERVAL_MS);
    } else {
      if (liveDataIntervalRef.current) clearInterval(liveDataIntervalRef.current);
    }
    return () => {
      if (liveDataIntervalRef.current) clearInterval(liveDataIntervalRef.current);
    };
  }, [isTestRunning, selectedFilter, generateMockData]);

  // Effect for logging data to localStorage
  useEffect(() => {
    if (isTestRunning && selectedFilter && currentTestRunId) {
      loggingIntervalRef.current = setInterval(() => {
        const newValue = generateMockData();
        const newStoredDataPoint: StoredDataPoint = {
          timestamp: new Date().toISOString(),
          value: newValue,
          filterId: selectedFilter.id
        };
        storageService.addDataPointToTestRun(currentTestRunId, newStoredDataPoint);
      }, LOGGING_INTERVAL_MS);
    } else {
      if (loggingIntervalRef.current) clearInterval(loggingIntervalRef.current);
    }
    return () => {
      if (loggingIntervalRef.current) clearInterval(loggingIntervalRef.current);
    };
  }, [isTestRunning, selectedFilter, generateMockData, currentTestRunId]);

  // Effect for countdown timer
  useEffect(() => {
    if (isTestRunning && remainingTime > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            if(countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            handleStopTest('completed'); // Test completed naturally
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (isTestRunning && remainingTime === 0) { // Ensure test stops if timer reaches 0 and wasn't stopped manually
         // handleStopTest is already called above, so this might be redundant, but ensures cleanup
      }
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestRunning, remainingTime]);


  const handleFilterSelect = (filter: FilterOption) => {
    if (isTestRunning) {
      toast({
        title: "Ensaio em Execussão",
        description: "Por favor, pare o Ensaio Atual antes de mudar os Filtros.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFilter(filter);
    setLiveData([]);
    toast({
      title: "Ensaio Selecionado",
      description: `${filter.name} esta é a filtragem do Ensaio Agora.`,
    });
  };

  const handleStartTest = () => {
    if (!selectedFilter) {
      toast({
        title: "Selecione Uma Ensaio",
        description: "Por favor selecione uma filtragem para iniciar o Ensaio.",
        variant: "destructive",
      });
      return;
    }
    if (testDuration <= 0) {
        toast({
            title: "Duração Inválida",
            description: "Por favor, insira uma duração de ensaio válida (maior que 0 segundos).",
            variant: "destructive",
        });
        return;
    }
    
    const newTestRunId = crypto.randomUUID();
    const newTestRun: TestRun = {
      id: newTestRunId,
      filterId: selectedFilter.id,
      filterName: selectedFilter.name,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'running',
      loggedData: [],
      testDurationSeconds: testDuration,
    };
    storageService.addTestRun(newTestRun);
    setCurrentTestRunId(newTestRunId);
    setRemainingTime(testDuration);
    setIsTestRunning(true);
    setLiveData([]); 
    toast({
      title: "Ensaio Iniciado",
      description: `Ensaio para ${selectedFilter.name} Iniciado. Duração: ${formatTime(testDuration)}.`,
    });
  };

  const handleStopTest = (status: TestRun['status'] = 'stopped') => {
    setIsTestRunning(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (loggingIntervalRef.current) clearInterval(loggingIntervalRef.current);
    if (liveDataIntervalRef.current) clearInterval(liveDataIntervalRef.current);

    if (currentTestRunId) {
      storageService.updateTestRun(currentTestRunId, {
        endTime: new Date().toISOString(),
        status: status,
      });
      setCurrentTestRunId(null);
    }
    setRemainingTime(0);
    toast({
      title: status === 'completed' ? "Ensaio Concluído" : (status === 'aborted' ? "Ensaio Abortado" : "Ensaio Pausado"),
      description: status === 'completed' ? "O ensaio foi concluído." : (status === 'aborted' ? "O ensaio foi abortado." : "Ensaio Interrompido."),
    });
  };

  const handleDownloadCsv = () => {
    const allTestRuns = storageService.getTestRuns();
    const completedOrStoppedTestRuns = allTestRuns.filter(
      tr => (tr.status === 'completed' || tr.status === 'stopped' || tr.status === 'aborted') && tr.loggedData.length > 0
    );

    if (completedOrStoppedTestRuns.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não existem dados coletados para o Relatorio.",
        variant: "destructive",
      });
      return;
    }

    const csvRows = [];
    csvRows.push("TestRunID,TestFilterName,TestStartTime,TestEndTime,TestDurationSetSeconds,TestStatus,DataTimestamp,DataValue,DataUnit");

    completedOrStoppedTestRuns.forEach(testRun => {
      const testFilterOption = filterOptions.find(f => f.id === testRun.filterId);
      const unit = testFilterOption?.unit || '';
      testRun.loggedData.forEach(dataPoint => {
        csvRows.push([
          testRun.id,
          testRun.filterName,
          format(new Date(testRun.startTime), 'yyyy-MM-dd HH:mm:ss'),
          testRun.endTime ? format(new Date(testRun.endTime), 'yyyy-MM-dd HH:mm:ss') : 'N/A',
          testRun.testDurationSeconds || 'N/A',
          testRun.status,
          format(new Date(dataPoint.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          dataPoint.value,
          unit
        ].join(","));
      });
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const filename = `minas_teste_relatorio_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "CSV Exportado",
        description: `Relatorio ${filename} salvo com sucesso.`,
      });
    } else {
       toast({
        title: "Falha na Exportação",
        description: "Exportação CSV não suportada pelo seu Navegador.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <header className="mb-8 text-center">
        <div className="flex justify-between items-center w-full">
            <div className="flex-1 flex justify-start gap-2">
                <Link href="/history" passHref>
                    <Button variant="outline" size="icon" className="self-start" aria-label="Histórico de Ensaios">
                        <History className="w-5 h-5" />
                    </Button>
                </Link>
            </div>
            <div className="flex-1 flex flex-col items-center">
                 <h1 className="text-4xl font-bold text-primary flex items-center justify-center">
                    <Activity className="w-10 h-10 mr-3" /> Minas Teste Solução
                </h1>
                <p className="text-foreground/80">Monitoramento e Relatorio.</p>
            </div>
            <div className="flex-1 flex justify-end">
                <Link href="/settings" passHref>
                    <Button variant="outline" size="icon" className="self-start" aria-label="Configurações">
                        <Settings className="w-5 h-5" />
                    </Button>
                </Link>
            </div>
        </div>
      </header>

      <Card className="mb-6 shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><SlidersHorizontal className="w-6 h-6 mr-2 text-accent" />Escolha uma Filtragem para Monitoramento</CardTitle>
          <CardDescription>Escolha um grau de filtragem para monitormaneto do Ensaio.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-3">
          {filterOptions.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter?.id === filter.id ? 'default' : 'secondary'}
              onClick={() => handleFilterSelect(filter)}
              className={`flex-grow md:flex-grow-0 w-full md:w-auto py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${selectedFilter?.id === filter.id ? 'ring-2 ring-accent' : ''}`}
              aria-pressed={selectedFilter?.id === filter.id}
            >
              <filter.icon className="w-5 h-5 mr-2" />
              {filter.name}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl"><FilterIcon className="w-6 h-6 mr-2 text-accent"/>Controle de Ensaio</CardTitle>
           <CardDescription>
            {selectedFilter ? `Controle de ${selectedFilter.name} Monitoramento.` : "Selecione Um Grau de Filtragem para iniciar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <Label htmlFor="testDuration" className="text-sm font-medium text-foreground/80">Duração do Ensaio (segundos)</Label>
            <Input
              id="testDuration"
              type="number"
              value={testDuration}
              onChange={(e) => setTestDuration(parseInt(e.target.value, 10))}
              min="1"
              className="w-full sm:w-40 bg-input text-foreground"
              disabled={isTestRunning}
            />
          </div>
          <Button
            onClick={handleStartTest}
            disabled={!selectedFilter || isTestRunning}
            size="lg"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white disabled:bg-muted"
            aria-label="Start Test"
          >
            <Play className="w-5 h-5 mr-2" /> Inicar Ensaio 
          </Button>
          <Button
            onClick={() => handleStopTest('aborted')}
            disabled={!isTestRunning}
            size="lg"
            variant="destructive"
            className="w-full sm:w-auto disabled:bg-muted"
            aria-label="Stop Test"
          >
            <StopCircle className="w-5 h-5 mr-2" /> Parar Ensaio
          </Button>
          <Button
            onClick={handleDownloadCsv}
            disabled={isTestRunning || storageService.getTestRuns().filter(tr => (tr.status === 'completed' || tr.status === 'stopped' || tr.status === 'aborted') && tr.loggedData.length > 0).length === 0}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-accent text-accent-foreground hover:bg-accent/20 disabled:opacity-50 disabled:border-muted disabled:text-muted-foreground"
            aria-label="Download Log as CSV"
          >
            <Download className="w-5 h-5 mr-2" /> Gerar Relatório CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="flex-grow shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center text-2xl">
              <Activity className="w-6 h-6 mr-2 text-accent" />
              Dados Ao Vivo {selectedFilter ? `(${selectedFilter.name})` : ''}
            </CardTitle>
            {isTestRunning && (
              <div className="text-xl font-mono text-accent-foreground p-2 bg-accent/20 rounded-md">
                {formatTime(remainingTime)}
              </div>
            )}
          </div>
          <CardDescription>
            {isTestRunning ? `Exibindo as últimas leituras para ${selectedFilter?.name}. Atualizações a cada ${LIVE_DATA_INTERVAL_MS / 1000} segundo(s).` : "Inicie um Ensaio para ver os Dados."}
            {!selectedFilter && !isTestRunning && " Selecione um Ensaio."}
             {isTestRunning && ` Logando dados para relatório a cada ${LOGGING_INTERVAL_MS / 1000} segundos.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {liveData.length > 0 ? (
            <div className="overflow-x-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liveData.map((row, index) => (
                    <TableRow key={index} className={index === 0 ? 'bg-accent/10' : ''}>
                      <TableCell>{format(row.timestamp, 'HH:mm:ss.SSS')}</TableCell>
                      <TableCell className="font-mono">{row.value.toFixed(2)}</TableCell>
                      <TableCell>{selectedFilter?.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-foreground/70 py-8">
              {isTestRunning ? "Aguardando Dados..." : "Nenhum dado ao vivo para exibir. Inicie um ensaio."}
            </p>
          )}
        </CardContent>
      </Card>
       <footer className="mt-12 text-center text-foreground/70 text-sm">
        <p>&copy; {new Date().getFullYear()} MINAS TESTE SOLUÇÕES. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
