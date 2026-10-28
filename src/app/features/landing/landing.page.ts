import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-900 selection:bg-cyan-500 selection:text-white">
      <!-- Header / Nav -->
      <header class="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-cyan-700 flex items-center justify-center text-white font-bold text-xl shadow-md"
            >
              F
            </div>
            <span class="text-2xl font-black tracking-tight text-cyan-950">FIXTECH</span>
          </div>

          <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#caracteristicas" class="hover:text-cyan-700 transition-colors"
              >Características</a
            >
            <a href="#como-funciona" class="hover:text-cyan-700 transition-colors">Cómo funciona</a>
            <a href="#tecnicos" class="hover:text-cyan-700 transition-colors">Para Técnicos</a>
            <a href="#faq" class="hover:text-cyan-700 transition-colors">Preguntas frecuentes</a>
          </nav>

          <div class="flex items-center gap-3">
            <a mat-button routerLink="/login" class="text-cyan-800 font-medium">Ingresar</a>
            <a
              mat-flat-button
              color="primary"
              routerLink="/registro"
              class="bg-cyan-700 hover:bg-cyan-800 text-white font-medium"
            >
              Registrarse
            </a>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section
        class="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-cyan-50/50 to-white"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div class="grid lg:grid-cols-12 gap-12 items-center">
            <div class="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-900 text-xs font-semibold uppercase tracking-wider"
              >
                <mat-icon class="text-cyan-700 !text-base !w-4 !h-4">verified</mat-icon>
                Servicio técnico profesional verificado en Perú
              </div>

              <h1
                class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]"
              >
                Reparaciones y soporte técnico <span class="text-cyan-700">con total garantía</span>
              </h1>

              <p class="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Conectamos clientes con técnicos especializados en electrodomésticos, cómputo, redes
                y mantenimiento. Cotizaciones transparentes, seguimiento en tiempo real y
                constancias digitales.
              </p>

              <div
                class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
              >
                <a
                  mat-flat-button
                  color="primary"
                  routerLink="/registro"
                  class="w-full sm:w-auto !h-12 !px-8 !text-base bg-cyan-700 hover:bg-cyan-800 text-white font-medium flex items-center justify-center"
                >
                  Solicitar un servicio
                </a>
                <a
                  mat-stroked-button
                  routerLink="/registro-tecnico"
                  class="w-full sm:w-auto !h-12 !px-8 !text-base !border-slate-300 text-slate-700 hover:bg-slate-100 font-medium flex items-center justify-center"
                >
                  Soy técnico / registrar taller
                </a>
              </div>

              <div
                class="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 text-center lg:text-left"
              >
                <div>
                  <div class="text-2xl font-black text-cyan-900">+1,500</div>
                  <div class="text-xs text-slate-500">Servicios completados</div>
                </div>
                <div>
                  <div class="text-2xl font-black text-cyan-900">100%</div>
                  <div class="text-xs text-slate-500">Técnicos verificados</div>
                </div>
                <div>
                  <div class="text-2xl font-black text-cyan-900">4.9 ★</div>
                  <div class="text-xs text-slate-500">Valoración promedio</div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-5 relative">
              <div
                class="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-600 to-amber-500 opacity-25 blur-xl"
              ></div>
              <div
                class="relative bg-white p-8 rounded-3xl shadow-xl border border-slate-200 space-y-6"
              >
                <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-800 font-bold"
                    >
                      <mat-icon>build</mat-icon>
                    </div>
                    <div>
                      <div class="font-bold text-slate-900">Mantenimiento Preventivo</div>
                      <div class="text-xs text-slate-500">Solicitud #4821</div>
                    </div>
                  </div>
                  <span
                    class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full"
                    >En proceso</span
                  >
                </div>

                <div class="space-y-3 text-sm text-slate-600">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Técnico asignado:</span>
                    <span class="font-medium text-slate-800">Carlos Mendoza (Verificado)</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Modalidad:</span>
                    <span class="font-medium text-slate-800">A domicilio</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Garantía FIXTECH:</span>
                    <span class="font-medium text-emerald-700">30 días respaldados</span>
                  </div>
                </div>

                <div
                  class="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <mat-icon class="text-amber-500">star</mat-icon>
                    <span class="text-sm font-medium text-slate-700"
                      >Constancia digital de entrega</span
                    >
                  </div>
                  <span class="text-xs text-cyan-700 font-bold">Firmada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Características principales -->
      <section id="caracteristicas" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900">¿Por qué elegir FIXTECH?</h2>
            <p class="text-slate-600 text-lg">
              Diseñado para ofrecer seguridad, transparencia y eficiencia tanto a hogares como a
              profesionales.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <div
              class="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 hover:border-cyan-300 transition-all"
            >
              <div
                class="w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center"
              >
                <mat-icon class="!text-2xl">verified_user</mat-icon>
              </div>
              <h3 class="text-xl font-bold text-slate-900">Técnicos 100% Verificados</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Validamos antecedentes, documentos de identidad y constancias profesionales para
                garantizar la máxima seguridad en tu domicilio o taller.
              </p>
            </div>

            <div
              class="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 hover:border-cyan-300 transition-all"
            >
              <div
                class="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center"
              >
                <mat-icon class="!text-2xl">receipt_long</mat-icon>
              </div>
              <h3 class="text-xl font-bold text-slate-900">Negociación y Presupuestos Claros</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Recibe ofertas detalladas con desglose de repuestos y mano de obra. Sin sorpresas ni
                costos ocultos al finalizar el servicio.
              </p>
            </div>

            <div
              class="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 hover:border-cyan-300 transition-all"
            >
              <div
                class="w-14 h-14 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center"
              >
                <mat-icon class="!text-2xl">security</mat-icon>
              </div>
              <h3 class="text-xl font-bold text-slate-900">Garantía y Constancias Digitales</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Cada servicio finaliza con fotos autenticadas y constancias digitales firmadas por
                ambas partes, asegurando el periodo de garantía.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Cómo funciona -->
      <section id="como-funciona" class="py-20 bg-slate-50 border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900">¿Cómo funciona?</h2>
            <p class="text-slate-600 text-lg">
              En tres sencillos pasos resuelve cualquier problema técnico.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <div
              class="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4 relative"
            >
              <div
                class="absolute -top-4 left-8 w-8 h-8 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-sm"
              >
                1
              </div>
              <h3 class="text-xl font-bold text-slate-900 pt-2">Publica tu solicitud</h3>
              <p class="text-slate-600 text-sm">
                Describe el equipo, el fallo que presenta, adjunta fotos opcionales y elige si
                prefieres servicio a domicilio o en taller.
              </p>
            </div>

            <div
              class="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4 relative"
            >
              <div
                class="absolute -top-4 left-8 w-8 h-8 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-sm"
              >
                2
              </div>
              <h3 class="text-xl font-bold text-slate-900 pt-2">Compara y acepta ofertas</h3>
              <p class="text-slate-600 text-sm">
                Técnicos calificados enviarán propuestas de precio y tiempo. Revisa sus valoraciones
                y selecciona la mejor opción.
              </p>
            </div>

            <div
              class="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-4 relative"
            >
              <div
                class="absolute -top-4 left-8 w-8 h-8 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-sm"
              >
                3
              </div>
              <h3 class="text-xl font-bold text-slate-900 pt-2">Reparación y conformidad</h3>
              <p class="text-slate-600 text-sm">
                Realiza el seguimiento en tiempo real, recibe tu constancia digital al finalizar y
                califica el servicio prestado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA para técnicos -->
      <section id="tecnicos" class="py-20 bg-cyan-950 text-white relative overflow-hidden">
        <div
          class="absolute inset-0 opacity-10 bg-[radial-gradient(#1089a8_1px,transparent_1px)] [background-size:16px_16px]"
        ></div>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
              <span
                class="px-4 py-1.5 rounded-full bg-cyan-800 text-cyan-200 text-xs font-semibold uppercase tracking-wider"
              >
                ¿Eres profesional o tienes taller?
              </span>
              <h2 class="text-3xl sm:text-4xl font-black">Haz crecer tu negocio con FIXTECH</h2>
              <p class="text-slate-300 text-base leading-relaxed">
                Accede a cientos de solicitudes diarias en tu distrito, gestiona presupuestos sin
                intermediarios, programa tus servicios y construye una reputación sólida con pagos
                transparentes.
              </p>
              <div class="flex items-center gap-4 pt-4">
                <a
                  mat-flat-button
                  color="accent"
                  routerLink="/registro-tecnico"
                  class="!h-12 !px-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center justify-center"
                >
                  Registrarme como Técnico
                </a>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-cyan-900/60 p-6 rounded-3xl border border-cyan-800 space-y-2">
                <mat-icon class="text-amber-400 !text-3xl">trending_up</mat-icon>
                <div class="font-bold text-lg">Más clientes</div>
                <p class="text-xs text-slate-300">
                  Solicitudes filtradas por especialidad y zona geográfica.
                </p>
              </div>
              <div class="bg-cyan-900/60 p-6 rounded-3xl border border-cyan-800 space-y-2">
                <mat-icon class="text-amber-400 !text-3xl">verified</mat-icon>
                <div class="font-bold text-lg">Insignia oficial</div>
                <p class="text-xs text-slate-300">
                  Perfil verificado que genera confianza inmediata en los clientes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section id="faq" class="py-20 bg-white">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900">Preguntas frecuentes</h2>
            <p class="text-slate-600 text-lg">
              Todo lo que necesitas saber sobre nuestra plataforma.
            </p>
          </div>

          <div class="space-y-6">
            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 class="font-bold text-slate-900 text-lg mb-2">
                ¿Cómo se verifica a los técnicos?
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                Cada técnico debe presentar su DNI vigente, certificados de estudios o experiencia
                laboral, constancias de taller y antecedentes verificados por nuestro equipo
                administrativo antes de recibir solicitudes.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 class="font-bold text-slate-900 text-lg mb-2">
                ¿Qué sucede si hay un reclamo o problema con la reparación?
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                FIXTECH incluye un módulo de reclamos con soporte fotográfico y mediación
                administrativa para asegurar el cumplimiento del periodo de garantía indicado en la
                constancia digital.
              </p>
            </div>

            <div class="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 class="font-bold text-slate-900 text-lg mb-2">
                ¿Tiene algún costo registrarse como cliente?
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                El registro y la publicación de solicitudes para clientes es completamente gratuito.
                Solo pagas el monto acordado por el servicio de reparación una vez aceptada la
                oferta.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div
          class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-cyan-700 flex items-center justify-center text-white font-bold text-sm"
            >
              F
            </div>
            <span class="text-white font-bold tracking-tight text-lg">FIXTECH</span>
          </div>
          <p>© 2026 FIXTECH Perú. Todos los derechos reservados.</p>
          <div class="flex items-center gap-6">
            <a routerLink="/login" class="hover:text-white transition-colors">Iniciar sesión</a>
            <a routerLink="/registro" class="hover:text-white transition-colors">Registrarse</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingPage {}
