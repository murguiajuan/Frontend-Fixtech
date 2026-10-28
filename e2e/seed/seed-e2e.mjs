#!/usr/bin/env node
/**
 * Datos semilla para las pruebas E2E y la verificación manual.
 *
 * Crea (o reutiliza) tres cuentas:
 *   - admin@fixtech.pe / Admin123!          (administrador existente)
 *   - cliente.e2e@fixtech.pe / Cliente123!  (cliente)
 *   - tecnico.e2e@fixtech.pe / Tecnico123!  (técnico aprobado)
 *
 * Es idempotente: si una cuenta ya existe y la contraseña coincide, no la
 * vuelve a crear. Si el técnico no está aprobado, lo aprueba con la API de
 * administración. No modifica datos de producción: úselo solo en desarrollo
 * o en una base de datos de pruebas.
 *
 * Uso:
 *   API_URL=http://localhost:8082/api node e2e/seed/seed-e2e.mjs
 */

const API_URL = (process.env.API_URL ?? 'http://localhost:8082/api').replace(/\/$/, '');

const ADMIN = { correo: 'admin@fixtech.pe', password: 'Admin123!' };
const CLIENTE = { correo: 'cliente.e2e@fixtech.pe', password: 'Cliente123!' };
const TECNICO = { correo: 'tecnico.e2e@fixtech.pe', password: 'Tecnico123!' };

async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  });
  const texto = await respuesta.text();
  let cuerpo = null;
  if (texto.length > 0) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      cuerpo = texto;
    }
  }
  return { estado: respuesta.status, cuerpo };
}

async function iniciarSesion(correo, password) {
  const { estado, cuerpo } = await peticion('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, password }),
  });
  if (estado !== 200 || typeof cuerpo?.accessToken !== 'string') {
    return null;
  }
  return cuerpo;
}

async function perfil(token) {
  const { estado, cuerpo } = await peticion('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (estado !== 200) {
    throw new Error(`No se pudo leer /auth/me (HTTP ${estado})`);
  }
  return cuerpo;
}

async function registrarCliente() {
  const { estado, cuerpo } = await peticion('/auth/register/cliente', {
    method: 'POST',
    body: JSON.stringify({
      nombres: 'Cliente',
      apellidos: 'E2E',
      correo: CLIENTE.correo,
      celular: '987654321',
      dni: '90909090',
      password: CLIENTE.password,
      aceptoTerminos: true,
    }),
  });
  if (estado !== 201 && estado !== 200) {
    throw new Error(`Registro de cliente falló (HTTP ${estado}): ${JSON.stringify(cuerpo)}`);
  }
}

async function registrarTecnico(especialidadId, distritoId) {
  const { estado, cuerpo } = await peticion('/auth/register/tecnico', {
    method: 'POST',
    body: JSON.stringify({
      nombres: 'Técnico',
      apellidos: 'E2E',
      correo: TECNICO.correo,
      celular: '912345678',
      dni: '90909091',
      password: TECNICO.password,
      aceptoTerminos: true,
      descripcion: 'Técnico de pruebas E2E con experiencia en soporte y mantenimiento.',
      aniosExperiencia: 5,
      ofreceDomicilio: true,
      ofreceTaller: true,
      direccionTaller: 'Av. Grau 123, Piura',
      referenciaTaller: 'Frente al mercado',
      horarioTaller: 'Lunes a sábado, 9:00 a 18:00',
      especialidadIds: [especialidadId],
      distritoIds: [distritoId],
    }),
  });
  if (estado !== 201 && estado !== 200) {
    throw new Error(`Registro de técnico falló (HTTP ${estado}): ${JSON.stringify(cuerpo)}`);
  }
}

async function catalogos() {
  const especialidades = await peticion('/catalogos/especialidades');
  const distritos = await peticion('/catalogos/distritos');
  const especialidad = especialidades.cuerpo?.find((item) => item.activo !== false);
  const distrito = distritos.cuerpo?.find((item) => item.activo !== false);
  if (!especialidad || !distrito) {
    throw new Error('No hay especialidades o distritos activos para registrar al técnico.');
  }
  return { especialidadId: especialidad.id, distritoId: distrito.id };
}

async function asegurarCuenta(cuenta, registrar) {
  const sesion = await iniciarSesion(cuenta.correo, cuenta.password);
  if (sesion) {
    console.log(`  OK   ${cuenta.correo} ya existe y la contraseña coincide.`);
    return sesion;
  }

  console.log(`  ...  ${cuenta.correo} no existe; registrando.`);
  await registrar();

  const nuevaSesion = await iniciarSesion(cuenta.correo, cuenta.password);
  if (!nuevaSesion) {
    throw new Error(
      `La cuenta ${cuenta.correo} existe pero la contraseña no coincide. ` +
        'Use una base de pruebas limpia o elimine la cuenta antes de sembrar.',
    );
  }
  console.log(`  OK   ${cuenta.correo} creada.`);
  return nuevaSesion;
}

async function main() {
  console.log(`Sembrando datos E2E en ${API_URL}`);

  const sesionAdmin = await iniciarSesion(ADMIN.correo, ADMIN.password);
  if (!sesionAdmin) {
    throw new Error(
      'No se pudo iniciar sesión como administrador. ' +
        'Verifique que el backend esté activo y que admin@fixtech.pe / Admin123! sea válido.',
    );
  }
  console.log(`  OK   ${ADMIN.correo} autenticado.`);

  const { especialidadId, distritoId } = await catalogos();
  await asegurarCuenta(CLIENTE, registrarCliente);
  const sesionTecnico = await asegurarCuenta(TECNICO, () =>
    registrarTecnico(especialidadId, distritoId),
  );

  const perfilTecnico = await perfil(sesionTecnico.accessToken);
  const tecnico = perfilTecnico.tecnico;
  if (!tecnico) {
    throw new Error('El perfil del técnico no incluye los datos de técnico.');
  }

  if (tecnico.estadoVerificacion !== 'APROBADO') {
    const { estado, cuerpo } = await peticion(`/admin/tecnicos/${tecnico.id}/verificacion`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sesionAdmin.accessToken}` },
      body: JSON.stringify({ estado: 'APROBADO', motivo: null }),
    });
    if (estado !== 200) {
      throw new Error(`No se pudo aprobar al técnico (HTTP ${estado}): ${JSON.stringify(cuerpo)}`);
    }
    console.log('  OK   Técnico aprobado por el administrador.');
  } else {
    console.log('  OK   El técnico ya estaba aprobado.');
  }

  console.log('\nCuentas de prueba:');
  console.log(`  Administrador: ${ADMIN.correo} / ${ADMIN.password}`);
  console.log(`  Cliente:       ${CLIENTE.correo} / ${CLIENTE.password}`);
  console.log(`  Técnico:       ${TECNICO.correo} / ${TECNICO.password}`);
  console.log('\nDatos semilla listos.');
}

main().catch((error) => {
  console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
