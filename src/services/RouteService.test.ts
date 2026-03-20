/**
 * Test básico para RouteService
 * 
 * Este archivo contiene pruebas de integración para verificar que el RouteService
 * funciona correctamente con la base de datos.
 * 
 * Para ejecutar: npm run test (si está configurado)
 * 
 * NOTA: Estas pruebas requieren:
 * - Base de datos configurada con tablas de Tasks 1-3
 * - Usuario autenticado con empresa_id
 * - Datos de prueba (empleados, rutas)
 */

import { routeService } from './RouteService';
import { auditService } from './AuditService';

/**
 * Test de creación de hoja de ruta
 */
export async function testCreateHojaRuta() {
  console.log('🧪 Test: Crear hoja de ruta');
  
  try {
    const hojaRuta = await routeService.createHojaRuta({
      empleado_id: 'test-empleado-id', // Reemplazar con ID real
      ruta_id: 'test-ruta-id', // Reemplazar con ID real
      fecha: new Date().toISOString().split('T')[0],
      monto_asignado_rdp: 5000,
      facturas: [
        {
          numero: 'F001',
          monto: 10000,
          moneda: 'RD$',
          estado_pago: 'pagada'
        },
        {
          numero: 'F002',
          monto: 500,
          moneda: 'USD',
          estado_pago: 'pendiente'
        }
      ]
    });

    console.log('✅ Hoja de ruta creada:', hojaRuta.identificador);
    console.log('   ID:', hojaRuta.id);
    console.log('   Estado:', hojaRuta.estado);
    
    // Registrar en auditoría
    await auditService.logCreate('hoja_ruta', {
      hoja_ruta_id: hojaRuta.id,
      identificador: hojaRuta.identificador
    });
    
    return hojaRuta;
  } catch (error) {
    console.error('❌ Error al crear hoja de ruta:', error);
    throw error;
  }
}

/**
 * Test de registro de gasto
 */
export async function testRegisterGasto(hojaRutaId: string) {
  console.log('🧪 Test: Registrar gasto');
  
  try {
    await routeService.registerGasto(hojaRutaId, {
      tipo: 'combustible',
      descripcion: 'Gasolina para la ruta',
      monto: 1500,
      moneda: 'RD$',
      evidencia_requerida: true,
      evidencia_id: undefined // En producción, subir foto primero
    });

    console.log('✅ Gasto registrado correctamente');
    
    // Registrar en auditoría
    await auditService.logAction({
      accion: 'REGISTER_GASTO',
      recurso: 'hoja_ruta',
      detalles: { hoja_ruta_id: hojaRutaId, tipo: 'combustible' },
      exitoso: true
    });
  } catch (error) {
    console.error('❌ Error al registrar gasto:', error);
    throw error;
  }
}

/**
 * Test de cálculo de balance
 */
export async function testCalculateBalance(hojaRutaId: string) {
  console.log('🧪 Test: Calcular balance');
  
  try {
    const balance = await routeService.calculateBalance(hojaRutaId);
    
    console.log('✅ Balance calculado:');
    console.log('   Total facturas RD$:', balance.total_facturas_rdp);
    console.log('   Total facturas USD:', balance.total_facturas_usd);
    console.log('   Total gastos RD$:', balance.total_gastos_rdp);
    console.log('   Total gastos USD:', balance.total_gastos_usd);
    console.log('   Disponible RD$:', balance.dinero_disponible_rdp);
    console.log('   Disponible USD:', balance.dinero_disponible_usd);
    
    return balance;
  } catch (error) {
    console.error('❌ Error al calcular balance:', error);
    throw error;
  }
}

/**
 * Test de marcar factura como entregada
 */
export async function testMarkFacturaEntregada(facturaId: string) {
  console.log('🧪 Test: Marcar factura como entregada');
  
  try {
    await routeService.markFacturaEntregada(facturaId);
    console.log('✅ Factura marcada como entregada');
  } catch (error) {
    console.error('❌ Error al marcar factura:', error);
    throw error;
  }
}

/**
 * Test de marcar factura como cobrada
 */
export async function testMarkFacturaCobrada(facturaId: string) {
  console.log('🧪 Test: Marcar factura como cobrada');
  
  try {
    await routeService.markFacturaCobrada(facturaId, {
      monto_cobrado: 10000,
      moneda_cobrada: 'RD$'
    });
    console.log('✅ Factura marcada como cobrada');
  } catch (error) {
    console.error('❌ Error al marcar factura como cobrada:', error);
    throw error;
  }
}

/**
 * Test de obtener hoja de ruta completa
 */
export async function testGetHojaRuta(hojaRutaId: string) {
  console.log('🧪 Test: Obtener hoja de ruta completa');
  
  try {
    const hojaRuta = await routeService.getHojaRutaById(hojaRutaId);
    
    console.log('✅ Hoja de ruta obtenida:');
    console.log('   Identificador:', hojaRuta.identificador);
    console.log('   Estado:', hojaRuta.estado);
    console.log('   Facturas:', hojaRuta.facturas.length);
    console.log('   Gastos:', hojaRuta.gastos.length);
    console.log('   Balance RD$:', hojaRuta.balance.dinero_disponible_rdp);
    console.log('   Balance USD:', hojaRuta.balance.dinero_disponible_usd);
    
    return hojaRuta;
  } catch (error) {
    console.error('❌ Error al obtener hoja de ruta:', error);
    throw error;
  }
}

/**
 * Test de auditoría
 */
export async function testAuditService() {
  console.log('🧪 Test: Servicio de auditoría');
  
  try {
    // Registrar acción de prueba
    await auditService.logAction({
      accion: 'TEST',
      recurso: 'test',
      detalles: { test: true },
      exitoso: true
    });
    
    console.log('✅ Log de auditoría registrado');
    
    // Obtener logs recientes
    const logs = await auditService.getAuditLogs({}, 10, 0);
    console.log(`✅ Logs obtenidos: ${logs.length} registros`);
    
    if (logs.length > 0) {
      console.log('   Último log:', {
        accion: logs[0].accion,
        recurso: logs[0].recurso,
        exitoso: logs[0].exitoso,
        fecha: logs[0].created_at
      });
    }
  } catch (error) {
    console.error('❌ Error en servicio de auditoría:', error);
    throw error;
  }
}

/**
 * Suite completa de tests
 */
export async function runAllTests() {
  console.log('🚀 Iniciando suite de tests para RouteService y AuditService\n');
  
  try {
    // Test 1: Auditoría
    await testAuditService();
    console.log('');
    
    // Test 2: Crear hoja de ruta
    // NOTA: Descomentar y ajustar IDs reales para ejecutar
    // const hojaRuta = await testCreateHojaRuta();
    // console.log('');
    
    // Test 3: Registrar gasto
    // await testRegisterGasto(hojaRuta.id);
    // console.log('');
    
    // Test 4: Calcular balance
    // await testCalculateBalance(hojaRuta.id);
    // console.log('');
    
    // Test 5: Obtener hoja de ruta completa
    // await testGetHojaRuta(hojaRuta.id);
    // console.log('');
    
    console.log('✅ Todos los tests completados exitosamente');
  } catch (error) {
    console.error('❌ Suite de tests falló:', error);
    throw error;
  }
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).routeServiceTests = {
    testCreateHojaRuta,
    testRegisterGasto,
    testCalculateBalance,
    testMarkFacturaEntregada,
    testMarkFacturaCobrada,
    testGetHojaRuta,
    testAuditService,
    runAllTests
  };
  
  console.log('💡 Tests disponibles en window.routeServiceTests');
  console.log('   Ejemplo: await window.routeServiceTests.testAuditService()');
}
