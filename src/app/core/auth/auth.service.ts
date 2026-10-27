import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  PerfilUsuario,
  RegistroClienteRequest,
  RegistroTecnicoRequest,
  TokenResponse,
  UsuarioRegistradoResponse,
} from './auth.models';
import { SessionStore } from './session-store.service';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly session = inject(SessionStore);

  private readonly perfilState = signal<PerfilUsuario | null>(null);
  private readonly cargandoState = signal(false);
  private cargaEnCurso$: Observable<PerfilUsuario> | null = null;

  readonly perfil = computed(() => (this.session.tieneSesion() ? this.perfilState() : null));
  readonly cargando = this.cargandoState.asReadonly();
  readonly autenticado = computed(() => this.perfil() !== null);
  readonly rol = computed(() => this.perfil()?.rol ?? null);
  readonly nombreCompleto = computed(() => {
    const perfil = this.perfil();
    return perfil === null ? '' : `${perfil.nombres} ${perfil.apellidos}`.trim();
  });
  readonly esTecnicoAprobado = computed(() => {
    const perfil = this.perfil();
    if (perfil === null || perfil.rol !== 'TECNICO') {
      return true;
    }
    return perfil.tecnico?.estadoVerificacion === 'APROBADO';
  });
  readonly bloqueadoPorDeuda = computed(() => this.perfil()?.tecnico?.bloqueadoPorDeuda === true);
  readonly puedeOfertar = computed(() => this.esTecnicoAprobado() && !this.bloqueadoPorDeuda());

  iniciarSesion(credenciales: LoginRequest): Observable<PerfilUsuario> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      tap((tokens) => this.session.guardar(tokens)),
      switchMap(() => this.cargarPerfil()),
    );
  }

  registrarCliente(request: RegistroClienteRequest): Observable<UsuarioRegistradoResponse> {
    return this.http.post<UsuarioRegistradoResponse>(
      `${environment.apiUrl}/auth/register/cliente`,
      request,
    );
  }

  registrarTecnico(request: RegistroTecnicoRequest): Observable<UsuarioRegistradoResponse> {
    return this.http.post<UsuarioRegistradoResponse>(
      `${environment.apiUrl}/auth/register/tecnico`,
      request,
    );
  }

  cargarPerfil(): Observable<PerfilUsuario> {
    if (this.cargaEnCurso$ !== null) {
      return this.cargaEnCurso$;
    }
    this.cargandoState.set(true);
    this.cargaEnCurso$ = this.http.get<PerfilUsuario>(`${environment.apiUrl}/auth/me`).pipe(
      tap((perfil) => this.perfilState.set(perfil)),
      catchError((error: unknown) => {
        this.limpiarSesion();
        return throwError(() => error);
      }),
      finalize(() => {
        this.cargandoState.set(false);
        this.cargaEnCurso$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.cargaEnCurso$;
  }

  asegurarSesion(): Observable<boolean> {
    if (!this.session.tieneSesion()) {
      this.perfilState.set(null);
      return of(false);
    }
    if (this.perfilState() !== null) {
      return of(true);
    }
    return this.cargarPerfil().pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  cerrarSesion(redirigir = true): void {
    this.limpiarSesion();
    if (redirigir) {
      void this.router.navigate(['/login']);
    }
  }

  private limpiarSesion(): void {
    this.session.limpiar();
    this.perfilState.set(null);
  }
}
