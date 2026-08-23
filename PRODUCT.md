# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Docentes** (usuario más frecuente). Registran notas, asistencia y conducta desde el aula o en casa, normalmente al cierre de una clase o de la jornada. Trabajan contra el reloj y con listas largas (aulas de 9 a 20 alumnos). Cada docente ve solo las aulas y cursos que le fueron asignados.

**Dirección y coordinación.** Supervisan todo: matrícula, personal, finanzas, asignación de cursos a docentes, configuración institucional. Consultan más de lo que registran.

**Apoderados (padres de familia).** Consultan notas, asistencia, conducta y pagos de sus hijos. Entran esporádicamente, desde celular o computadora. Hay dos vías de acceso: cuenta con correo y contraseña, o **código de acceso familiar** de 8 caracteres (sin cuenta, pensado para quien no maneja correo).

**Psicóloga.** Gestiona casos, sesiones e intervenciones. Es la única que puede aceptar o rechazar derivaciones — decisión clínica que dirección no puede tomar.

**Enfermera.** Fichas médicas: tipo de sangre, alergias, medicación, condiciones.

## Product Purpose

Plataforma de gestión escolar de la I.E.P. Cristo Reina (Ate-Vitarte, Lima, UGEL 06). Reemplaza el registro en papel y hojas de cálculo por un sistema único donde el docente registra una vez y el dato llega solo a la libreta del alumno y al portal del apoderado.

El problema que resuelve para el colegio: las comunicaciones iban en la agenda física y **los padres casi no la revisaban**. La plataforma busca que la información llegue realmente.

Está **en producción con datos reales**: ~90 alumnos matriculados, docentes y apoderados reales usándola.

## Operating Context

- **Calendario peruano:** año escolar de marzo a diciembre, dividido en 4 bimestres (I: mar–may, II: jun–jul, III: ago–sep, IV: oct–dic).
- **Tres niveles:** Inicial, Primaria, Secundaria.
- **Aulas polígrado:** un aula puede cubrir varios grados (ej. "Amistosos" = 1° y 2° de Primaria). Las aulas tienen nombre propio — Amistosos, Bondadosos, Solidarios, Pre 1, Pre 2, Pre 3 — y así las llama todo el colegio, no por grado.
- **Asistencia por QR:** cada alumno tiene un código QR que se escanea al entrar y salir.
- **Notificación a apoderados por WhatsApp:** mediante enlaces `wa.me` con texto prellenado que el personal confirma y envía. **No hay envío automático** — requeriría la API de pago de WhatsApp Business, que el colegio no tiene.

## Capabilities and Constraints

**Calificación (formato MINEDU).** La libreta se estructura como Área → Competencias, calificadas en escala literal **AD / A / B / C**. El docente registra notas **numéricas (0–20)** por criterio de evaluación (Actividades variables + Evaluación Mensual + Evaluación Bimestral) y el sistema deriva el literal automáticamente (18–20 AD, 14–17 A, 11–13 B, 0–10 C).

Un área se califica desde **un solo curso** asignado a un solo docente, aunque el horario la reparta en varios bloques. En Secundaria, Comunicación y Matemática se muestran al alumno y al apoderado con el nombre del curso que reconocen (Lenguaje, Literatura, Razonamiento Verbal / Aritmética, Álgebra, Geometría, Trigonometría), distinto del curso de calificación.

**Conducta.** Catálogo de 50 códigos del reglamento interno (A1–E18) agrupados en 5 categorías. Cada alumno parte de **20 puntos por bimestre** y cada falta descuenta según su gravedad (leve −2, grave −3, muy grave −5).

**Libreta impresa.** El Informe de Progreso debe poder imprimirse respetando el formato oficial de la boleta del colegio. En pantalla el diseño es libre; **al imprimir debe salir con la estructura oficial.**

**Otros módulos:** finanzas (pensiones y pagos), médico, psicología, biblioteca, plan lector, noticias y actividades.

## Brand Commitments

**Nombre:** I.E.P. Cristo Reina. Aparece junto a "UGEL 06 Ate-Vitarte" en documentos oficiales.

**Escudo institucional** (`public/logo-cr.png`, 512px, fondo transparente): escudo partido en azul royal y azul cielo, borde y corona dorados, monograma "CR" e "IEP" en blanco. Es el único activo de marca disponible; no existe versión vectorial. Su paleta —**azul royal, azul cielo, dorado, blanco**— es la identidad real del colegio y la referencia de color autorizada para la plataforma.

**Idioma:** todo en español peruano. Terminología del colegio: apoderado (no "padre/tutor"), aula (no "sección" a secas), bimestre, área, competencia, nivel de logro.

**Dirección visual (preferencia permanente, elegida por el usuario tras dos rondas de exploración):** sin tema ni metáfora. La plataforma no debe parecerse a un artefacto (tejido, mural, señalética, papelería); debe verse como software de producto contemporáneo bien hecho. La vara de calidad son **Linear, Notion, Vercel, Apple y Google**: superficies limpias, mucho aire, tipografía cuidada, jerarquía clara, profundidad sutil, movimiento contenido. El color institucional aporta identidad, no decoración. Rechazado explícitamente: direcciones "temáticas" que se sienten disfraz sobre la plataforma.

## Evidence on Hand

- Escudo institucional en PNG (única versión; no hay SVG ni manual de marca).
- Boleta oficial "Informe de Progreso" en Word, con la estructura exacta de áreas, competencias y niveles de logro.
- Reglamento interno en PDF, del que salió el catálogo de 50 códigos de conducta.
- Horarios reales de los tres niveles, de los que salió el catálogo de cursos.
- Datos reales en producción: ~90 alumnos, docentes, apoderados, aulas y cursos.

No existen: manual de marca, tipografía institucional definida, fotografía del colegio, ni versión vectorial del escudo.

## Product Principles

1. **Registrar una vez, que llegue a todos.** El docente ingresa la nota y esa misma verdad aparece en la libreta, en el consolidado y en el portal del apoderado, sin recapturas.
2. **El apoderado es el destinatario final.** Si la información no le llega y no la entiende, el sistema falló en su propósito — es lo que la agenda física ya hacía mal.
3. **Respetar el vocabulario del colegio.** Aulas por su nombre, no por su grado. Apoderado, no tutor. Áreas y competencias como las nombra el MINEDU.
4. **La acción principal siempre a la vista.** En registros largos el botón de guardar no puede quedar al final de la lista.
5. **El permiso refleja la responsabilidad real.** Quien decide en el colegio decide en el sistema: las derivaciones las resuelve la psicóloga, no dirección.

## Accessibility & Inclusion

Los apoderados usan tanto celular como computadora, con un rango amplio de edad y familiaridad tecnológica. La vía de acceso por código familiar existe precisamente para quienes no manejan correo electrónico. El diseño debe sostener texto legible y objetivos táctiles amplios sin asumir usuarios expertos.
