# Test Plan — Edge Cases Críticos Mini Jira

## Objetivo

Identificar y priorizar 5 Edge Cases críticos que podrían romper el MVP de **Mini Jira**, enfocados en riesgos de red, validación de datos, concurrencia, permisos y notificaciones.

---

## Matriz de priorización de riesgo

| ID | Edge Case crítico | Probabilidad | Impacto | Nivel de riesgo | Prioridad QA |
|---|---|---:|---:|---:|---:|
| EC-01 | Pérdida de conexión al guardar un ticket | Alta | Alta | **Crítico** | P1 |
| EC-02 | Entradas nulas, vacías o malformadas en campos obligatorios | Alta | Media/Alta | **Alto** | P1 |
| EC-03 | Concurrencia extrema sobre el mismo ticket | Media | Muy Alta | **Crítico** | P1 |
| EC-04 | Usuario sin permisos fuerza acciones desde API | Media | Muy Alta | **Crítico** | P1 |
| EC-05 | Reintentos duplican notificaciones o eventos | Media | Alta | **Alto** | P2 |

---

# EC-01 — Pérdida de conexión al guardar un ticket

## Riesgo

El usuario crea o edita un ticket, pero la conexión falla durante el guardado. Esto puede provocar estados ambiguos: el usuario cree que no se guardó, pero el backend sí lo procesó; o el frontend queda desactualizado.

## Impacto en el MVP

Puede causar duplicación de tickets, pérdida aparente de cambios, eventos de auditoría inconsistentes o múltiples notificaciones.

```gherkin id="k4knbk"
Feature: Manejo de fallas de red al guardar tickets

  Scenario: Evitar duplicidad cuando falla la conexión durante la creación de un ticket
    Given el usuario está autenticado
    And completa el formulario de creación de ticket con datos válidos
    When envía el formulario
    And ocurre una falla de red antes de recibir respuesta del servidor
    Then el sistema no debe crear tickets duplicados ante un reintento
    And debe permitir al usuario consultar si el ticket fue creado
    And debe mostrar un mensaje claro sobre el estado incierto de la operación
    And debe evitar enviar notificaciones duplicadas
```

## Mitigación recomendada

Usar identificador único de operación o `idempotency key` para creación de tickets, especialmente si hay reintentos automáticos desde frontend o backend.

---

# EC-02 — Entradas nulas, vacías o malformadas

## Riesgo

El usuario envía campos obligatorios como `title`, `description`, `priority`, `status` o `assignee_id` en `null`, vacíos, con espacios, tipos incorrectos o valores fuera del catálogo permitido.

## Impacto en el MVP

Puede romper listados, filtros, dashboard, auditoría o reglas de estado.

```gherkin id="e60aqp"
Feature: Validación estricta de entradas obligatorias

  Scenario: Rechazar ticket con campos obligatorios nulos o inválidos
    Given el usuario está autenticado
    And tiene permiso para crear tickets
    When intenta crear un ticket con título nulo, descripción vacía o estado inválido
    Then el backend debe rechazar la solicitud
    And debe retornar errores claros por cada campo inválido
    And no debe crear el ticket
    And no debe generar auditoría
    And no debe generar notificaciones
```

## Mitigación recomendada

Validar en frontend y backend con el mismo contrato de datos. El backend debe ser la fuente final de validación.

---

# EC-03 — Concurrencia extrema sobre el mismo ticket

## Riesgo

Varios usuarios modifican el mismo ticket casi al mismo tiempo: uno cambia descripción, otro cambia estado, otro reasigna, otro archiva y otro comenta.

## Impacto en el MVP

Puede sobrescribir cambios, permitir comentarios en tickets archivados, dejar responsable incorrecto o generar auditoría incompleta.

```gherkin id="lt6o1d"
Feature: Control de concurrencia extrema en tickets

  Scenario: Evitar inconsistencias cuando varios usuarios modifican el mismo ticket simultáneamente
    Given cinco usuarios abren el mismo ticket con la misma versión
    And todos tienen permisos distintos sobre el ticket
    When un usuario archiva el ticket
    And otro intenta cambiar el estado
    And otro intenta editar la descripción
    And otro intenta reasignar el responsable
    And otro intenta agregar un comentario
    Then el sistema debe aceptar únicamente las operaciones válidas contra la versión vigente
    And debe rechazar las operaciones con versión desactualizada
    And debe impedir modificaciones sobre el ticket archivado
    And debe conservar una auditoría consistente de las operaciones aceptadas
    And no debe sobrescribir silenciosamente ningún cambio previo
```

## Mitigación recomendada

Aplicar control optimista con `version` o `updated_at` en todas las operaciones críticas: edición, cambio de estado, reasignación, archivado y comentarios.

---

# EC-04 — Usuario sin permisos fuerza acciones desde API

## Riesgo

Aunque el frontend oculte botones, un usuario puede intentar modificar, archivar, restaurar o ver tickets ajenos llamando directamente a la API.

## Impacto en el MVP

Es uno de los riesgos más críticos: exposición de datos, modificación no autorizada y ruptura de reglas de negocio.

```gherkin id="xog5vy"
Feature: Validación de permisos desde backend

  Scenario: Rechazar acciones forzadas desde API por usuario sin permisos
    Given existe un ticket que no pertenece al usuario
    And el ticket no está asignado al usuario
    And el usuario no tiene rol administrador
    When intenta editar, archivar, restaurar o cambiar el estado del ticket mediante una petición directa a la API
    Then el backend debe rechazar la operación
    And debe responder con error de autorización
    And no debe modificar el ticket
    And no debe registrar auditoría como operación exitosa
    And no debe generar notificaciones derivadas de la acción rechazada
```

## Mitigación recomendada

Todas las reglas de autorización deben estar en backend. El frontend solo debe mejorar la experiencia, no proteger el sistema.

---

# EC-05 — Reintentos duplican notificaciones o eventos

## Riesgo

Una acción como asignar responsable, mencionar a un usuario o cambiar estado a `blocked` puede ejecutarse una vez, pero el envío de email falla y se reintenta. Si no hay control, puede generar varios emails o eventos duplicados.

## Impacto en el MVP

Usuarios reciben múltiples correos por la misma acción, la tabla de eventos se ensucia y la trazabilidad pierde confiabilidad.

```gherkin id="hknx69"
Feature: Prevención de notificaciones duplicadas

  Scenario: Evitar duplicidad de emails ante reintentos de envío
    Given un usuario es asignado a un ticket
    And el sistema genera un evento de notificación "ticket_assigned"
    When el envío del email falla temporalmente
    And el sistema reintenta el envío
    Then no debe crear un segundo evento para la misma asignación
    And no debe enviar emails duplicados si el primer envío ya fue procesado
    And debe registrar el estado del intento de notificación
    And debe conservar trazabilidad del error y del reintento
```

## Mitigación recomendada

Crear una clave única para eventos de notificación basada en tipo de evento, ticket, usuario destino y acción origen.

---

# Priorización final

| Prioridad | Edge Case | Motivo |
|---|---|---|
| **P1** | EC-04 — Permisos forzados desde API | Puede comprometer seguridad y datos del sistema |
| **P1** | EC-03 — Concurrencia extrema | Puede causar pérdida o corrupción de información |
| **P1** | EC-01 — Falla de red al guardar | Puede duplicar tickets o generar estados ambiguos |
| **P1** | EC-02 — Entradas nulas o inválidas | Puede romper reglas, filtros y dashboard |
| **P2** | EC-05 — Notificaciones duplicadas | Afecta confiabilidad y experiencia, pero no siempre bloquea operación principal |

---

# Recomendación QA

Los primeros escenarios que deberían automatizarse son:

1. Permisos forzados desde API.
2. Concurrencia con versión desactualizada.
3. Archivado concurrente.
4. Creación con campos nulos.
5. Reintento de notificaciones sin duplicados.
