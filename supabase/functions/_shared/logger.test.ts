// Testes para modulo de logging estruturado

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { log, logDebug, logInfo, logWarn, logError } from './logger.ts';

Deno.test('log deve aceitar niveis validos', () => {
  // Nao deve lancar erro
  log('debug', 'Test debug');
  log('info', 'Test info');
  log('warn', 'Test warn');
  log('error', 'Test error');
});

Deno.test('log deve aceitar contexto opcional', () => {
  // Nao deve lancar erro
  log('info', 'Test com contexto', {
    usuario_id: 'uuid-123',
    acao: 'teste'
  });
});

Deno.test('helpers devem funcionar corretamente', () => {
  // Nao devem lancar erro
  logDebug('Debug message');
  logInfo('Info message');
  logWarn('Warning message');
  logError('Error message');
});

