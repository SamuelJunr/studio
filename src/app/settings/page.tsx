
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bluetooth, BluetoothConnected, BluetoothSearching, AlertTriangle, Terminal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// !!! IMPORTANTE: Ajuste estes UUIDs para corresponderem ao seu sketch do Arduino !!!
// Exemplo comum para módulos BLE seriais (HM-10, etc.):
const ARDUINO_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"; // Exemplo: Serviço Serial BLE
const ARDUINO_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"; // Exemplo: Característica TX/RX Serial BLE

// Exemplo alternativo: Serviço de Informações do Dispositivo (padrão BLE)
// const ARDUINO_SERVICE_UUID = "0000180a-0000-1000-8000-00805f9b34fb"; // Device Information Service
// const ARDUINO_CHARACTERISTIC_UUID = "00002a29-0000-1000-8000-00805f9b34fb"; // Manufacturer Name String

export default function SettingsPage() {
  const { toast } = useToast();
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Desconectado.");
  const [testData, setTestData] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isBluetoothApiSupported, setIsBluetoothApiSupported] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !navigator.bluetooth) {
      setIsBluetoothApiSupported(false);
      setStatusMessage("API Web Bluetooth não suportada neste navegador.");
      toast({
        title: "API Não Suportada",
        description: "A API Web Bluetooth não é suportada pelo seu navegador. Tente Chrome ou Edge.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleConnect = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Erro de Conexão",
        description: "API Web Bluetooth não disponível.",
        variant: "destructive",
      });
      return;
    }

    try {
      setStatusMessage("Procurando por dispositivos Arduino...");
      toast({ title: "Bluetooth", description: "Buscando dispositivos..." });

      const bleDevice = await navigator.bluetooth.requestDevice({
        // filters: [{ services: [ARDUINO_SERVICE_UUID] }], // Filtra por serviço UUID
        // OU filtre por nome, se souber e for único:
         filters: [{ namePrefix: 'HC-' }, { namePrefix: 'HM-' }, {name: 'ESP32'}], // Ex: HC-05, HM-10, ESP32
        // OU aceite todos os dispositivos (menos recomendado para produção):
        // acceptAllDevices: true,
        optionalServices: [ARDUINO_SERVICE_UUID, 'device_information'] // Inclua serviços que você pode querer acessar
      });

      setStatusMessage(`Conectando a ${bleDevice.name || 'dispositivo sem nome'}...`);
      setDevice(bleDevice);

      bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

      const server = await bleDevice.gatt?.connect();
      setStatusMessage(`Conectado a ${bleDevice.name || 'dispositivo'}. Obtendo serviço...`);

      const service = await server?.getPrimaryService(ARDUINO_SERVICE_UUID);
      if (!service) {
        throw new Error("Serviço Bluetooth não encontrado no dispositivo.");
      }
      setStatusMessage(`Serviço obtido. Obtendo característica...`);
      
      const char = await service.getCharacteristic(ARDUINO_CHARACTERISTIC_UUID);
      if (!char) {
        throw new Error("Característica Bluetooth não encontrada no serviço.");
      }
      setCharacteristic(char);

      setIsConnected(true);
      setStatusMessage(`Conectado e pronto: ${bleDevice.name || 'dispositivo'}.`);
      toast({
        title: "Conectado",
        description: `Conectado ao dispositivo ${bleDevice.name || 'Arduino'}.`,
      });

    } catch (error: any) {
      console.error("Erro de conexão Bluetooth:", error);
      setStatusMessage(`Falha na conexão: ${error.message}`);
      toast({
        title: "Erro de Conexão",
        description: error.message || "Não foi possível conectar ao dispositivo Bluetooth.",
        variant: "destructive",
      });
      setIsConnected(false);
      setDevice(null);
      setCharacteristic(null);
    }
  };

  const onDisconnected = () => {
    setStatusMessage("Dispositivo desconectado.");
    toast({ title: "Desconectado", description: "O dispositivo Bluetooth foi desconectado." });
    setIsConnected(false);
    setDevice(null);
    setCharacteristic(null);
    setIsTesting(false);
    setTestData([]);
  };

  const handleDisconnect = async () => {
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
      // O evento 'gattserverdisconnected' chamará onDisconnected()
    } else {
      onDisconnected(); // Limpa o estado se não estava realmente conectado
    }
  };

  const handleCharacteristicValueChanged = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;

    const decoder = new TextDecoder('utf-8');
    const receivedString = decoder.decode(value);
    
    setTestData(prevData => {
        const newData = [`[${new Date().toLocaleTimeString()}] ${receivedString}`, ...prevData];
        return newData.slice(0, 20); // Mantém apenas as últimas 20 mensagens
    });
  };

  const handleStartTestData = async () => {
    if (!characteristic || !characteristic.properties.notify) {
      toast({
        title: "Erro no Teste",
        description: "Característica não encontrada ou não suporta notificações.",
        variant: "destructive",
      });
      return;
    }
    try {
      setStatusMessage("Iniciando teste de leitura de dados...");
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
      setIsTesting(true);
      setTestData([]);
      toast({ title: "Teste Iniciado", description: "Escutando dados do Arduino..." });
    } catch (error: any) {
      setStatusMessage(`Erro ao iniciar teste: ${error.message}`);
      toast({
        title: "Erro no Teste",
        description: error.message || "Não foi possível iniciar o teste de leitura.",
        variant: "destructive",
      });
    }
  };

  const handleStopTestData = async () => {
    if (characteristic && characteristic.properties.notify && isTesting) {
      try {
        await characteristic.stopNotifications();
        characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        setIsTesting(false);
        setStatusMessage(`Teste parado. Conectado a ${device?.name || 'dispositivo'}.`);
        toast({ title: "Teste Parado", description: "Leitura de dados do Arduino interrompida." });
      } catch (error: any) {
        setStatusMessage(`Erro ao parar teste: ${error.message}`);
        toast({
          title: "Erro ao Parar Teste",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (characteristic && isTesting) {
        characteristic.stopNotifications().catch(e => console.warn("Falha ao parar notificações no desmonte:", e));
        characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
      }
      if (device && device.gatt?.connected) {
        device.gatt.disconnect();
      }
      if (device) {
        device.removeEventListener('gattserverdisconnected', onDisconnected);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device, characteristic, isTesting]); // Adicionei characteristic e isTesting às dependências

  if (!isBluetoothApiSupported) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <AlertTriangle className="w-6 h-6 mr-2 text-destructive" /> API Web Bluetooth Não Suportada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              Seu navegador não suporta a API Web Bluetooth, que é necessária para esta funcionalidade.
              Por favor, tente usar o Google Chrome ou Microsoft Edge em um desktop ou dispositivo Android.
            </p>
            <div className="mt-6 text-center">
              <Link href="/dashboard" passHref>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
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
            <Bluetooth className="w-8 h-8 mr-3" /> Configurações Arduino
          </h1>
          <Link href="/dashboard" passHref>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
        <p className="text-foreground/80">Conecte e teste seu dispositivo Arduino via Bluetooth.</p>
      </header>

      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            {isConnected ? <BluetoothConnected className="w-6 h-6 mr-2 text-green-500" /> : <BluetoothSearching className="w-6 h-6 mr-2 text-blue-500" />}
            Status da Conexão
          </CardTitle>
          <CardDescription>{statusMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Button onClick={handleConnect} className="w-full">
              <Bluetooth className="w-5 h-5 mr-2" /> Conectar ao Arduino
            </Button>
          ) : (
            <Button onClick={handleDisconnect} variant="destructive" className="w-full">
              <BluetoothConnected className="w-5 h-5 mr-2" /> Desconectar
            </Button>
          )}
           <div className="mt-4 p-2 border rounded-md bg-muted/50 text-sm">
            <p className="font-semibold">UUIDs de Exemplo em Uso:</p>
            <p>Serviço: <code className="text-xs">{ARDUINO_SERVICE_UUID}</code></p>
            <p>Característica: <code className="text-xs">{ARDUINO_CHARACTERISTIC_UUID}</code></p>
            <p className="mt-1 text-xs text-foreground/70">Ajuste estes UUIDs no código de `src/app/settings/page.tsx` para corresponder ao seu firmware do Arduino.</p>
          </div>
        </CardContent>
      </Card>

      {isConnected && characteristic && (
        <Card className="flex-grow shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Terminal className="w-6 h-6 mr-2 text-accent" />
              Teste de Leitura de Dados
            </CardTitle>
            <CardDescription>
              {isTesting ? "Recebendo dados do Arduino..." : "Clique para iniciar o teste de leitura de dados."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            {!isTesting ? (
              <Button onClick={handleStartTestData} className="w-full mb-4" disabled={!characteristic?.properties.notify}>
                Iniciar Teste de Leitura
              </Button>
            ) : (
              <Button onClick={handleStopTestData} variant="secondary" className="w-full mb-4">
                Parar Teste de Leitura
              </Button>
            )}
            {characteristic && !characteristic.properties.notify && (
                <p className="text-sm text-destructive text-center mb-4">
                    A característica selecionada (<code className="text-xs">{ARDUINO_CHARACTERISTIC_UUID}</code>) não suporta notificações. Verifique o firmware do Arduino.
                </p>
            )}
            <div className="flex-grow p-3 border rounded-md bg-muted/30 overflow-y-auto h-64">
              {testData.length > 0 ? (
                testData.map((data, index) => (
                  <pre key={index} className="text-sm whitespace-pre-wrap break-all mb-1">{data}</pre>
                ))
              ) : (
                <p className="text-foreground/70 text-center">
                  {isTesting ? "Aguardando dados..." : "Nenhum dado recebido ainda."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <footer className="mt-12 text-center text-foreground/70 text-sm">
        <p>&copy; {new Date().getFullYear()} MINAS TESTE SOLUÇÕES. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
