# Historias de Usuario críticas — MVP Mini Jira

Basado en el PRD de Mini Jira, estas son las 3 Historias de Usuario críticas para el MVP, priorizando gestión segura de tickets, colaboración con comentarios/notificaciones y dashboard con visibilidad por permisos.

---

## HU-01 — Gestionar tickets con permisos, estados y archivado lógico

**Como** usuario autenticado,  
**quiero** crear, visualizar, editar, asignar, cambiar estado y archivar tickets según mis permisos,  
**para** gestionar el trabajo del equipo sin perder trazabilidad ni eliminar información del sistema.

```gherkin
Feature: Gestión de tickets con permisos y archivado lógico

  Background:
    Given existen usuarios con rol "admin" y "user"
    And el usuario se encuentra autenticado

  Scenario: Crear un ticket válido
    Given el usuario tiene permiso para crear tickets
    When crea un ticket con título, descripción, prioridad y responsable
    Then el sistema registra el ticket
    And el ticket queda con estado inicial "todo"
    And el ticket conserva el creador, responsable, fecha de creación y versión inicial
    And el sistema registra el evento de creación en auditoría

  Scenario: Editar un ticket permitido
    Given existe un ticket activo visible para el usuario
    And el usuario tiene permiso para editarlo
    When actualiza campos permitidos del ticket
    Then el sistema guarda los cambios
    And incrementa la versión del ticket
    And registra en auditoría los campos modificados

  Scenario: Rechazar edición de ticket sin permisos
    Given existe un ticket activo
    And el usuario no tiene permiso para editarlo
    When intenta modificar el ticket
    Then el sistema rechaza la operación desde backend
    And el ticket conserva sus valores anteriores

  Scenario: Cambiar estado de un ticket asignado
    Given existe un ticket activo asignado al usuario
    When el usuario cambia el estado del ticket a "in_progress", "review", "blocked" o "done"
    Then el sistema actualiza el estado del ticket
    And registra el cambio de estado en auditoría

  Scenario: Reabrir un ticket finalizado
    Given existe un ticket en estado "done"
    When un administrador o el usuario asignado lo reabre
    Then el sistema permite cambiar el estado del ticket
    And registra el cambio en auditoría

  Scenario: Impedir reapertura no autorizada
    Given existe un ticket en estado "done"
    And el usuario no es administrador ni responsable asignado
    When intenta reabrir el ticket
    Then el sistema rechaza la operación

  Scenario: Archivar ticket usando la acción eliminar
    Given existe un ticket activo
    And el usuario tiene permiso para archivarlo
    When presiona la acción visual "Eliminar"
    Then el sistema archiva el ticket
    And no elimina físicamente el registro
    And el ticket deja de aparecer en vistas principales
    And el sistema registra el archivado en auditoría

  Scenario: Bloquear edición de ticket archivado
    Given existe un ticket archivado
    When un usuario intenta editarlo
    Then el sistema bloquea la edición
    And conserva intacta la información del ticket

  Scenario: Restaurar ticket archivado
    Given existe un ticket archivado
    And el usuario autenticado es administrador
    When restaura el ticket
    Then el ticket vuelve a estar disponible en vistas activas
    And el sistema registra la restauración en auditoría
```

---

## HU-02 — Colaborar en tickets mediante comentarios, menciones, notificaciones y control de concurrencia

**Como** usuario del equipo,  
**quiero** comentar tickets visibles, mencionar compañeros y recibir alertas relevantes,  
**para** colaborar sin duplicar notificaciones ni sobrescribir cambios hechos por otros usuarios.

```gherkin
Feature: Colaboración en tickets con comentarios, menciones, notificaciones y concurrencia

  Background:
    Given el usuario se encuentra autenticado
    And existe un ticket activo visible para el usuario

  Scenario: Agregar comentario a un ticket visible
    Given el usuario tiene permiso para comentar el ticket
    When agrega un comentario con contenido válido
    Then el sistema registra el comentario
    And guarda autor y fecha de creación
    And el comentario aparece en el historial del ticket

  Scenario: Detectar mención en comentario
    Given el usuario escribe un comentario con el formato "@usuario"
    When guarda el comentario
    Then el sistema detecta la mención
    And genera un evento de notificación "user_mentioned"
    And registra el evento para evitar duplicados por reintentos

  Scenario: Notificar asignación de responsable
    Given existe un ticket activo
    When un usuario con permisos asigna un responsable al ticket
    Then el sistema actualiza el responsable
    And registra el cambio en auditoría
    And genera un evento de notificación "ticket_assigned"

  Scenario: Notificar cambio a estado bloqueado
    Given existe un ticket asignado a un usuario
    When el estado del ticket cambia a "blocked"
    Then el sistema registra el cambio de estado
    And genera un evento de notificación "ticket_blocked"

  Scenario: Evitar notificaciones duplicadas
    Given existe un evento de notificación ya registrado para la misma acción
    When el sistema reintenta el envío del correo
    Then no crea eventos duplicados
    And conserva trazabilidad del intento de notificación

  Scenario: Detectar conflicto por edición concurrente
    Given dos usuarios abren el mismo ticket con la misma versión
    And el primer usuario guarda cambios correctamente
    When el segundo usuario intenta guardar cambios usando la versión anterior
    Then el sistema detecta conflicto de concurrencia
    And evita sobrescribir silenciosamente los cambios previos
    And muestra un mensaje indicando que el ticket fue modificado por otra persona
    And permite recargar la versión más reciente antes de guardar

  Scenario: Impedir comentario en ticket archivado durante concurrencia
    Given un usuario tiene abierto el detalle de un ticket activo
    And otro usuario archiva el ticket
    When el primer usuario intenta agregar un comentario
    Then el sistema rechaza el comentario
    And informa que el ticket ya no permite modificaciones

  Scenario: Conservar orden de comentarios simultáneos
    Given dos usuarios envían comentarios casi al mismo tiempo
    When el sistema registra ambos comentarios
    Then ambos comentarios quedan almacenados
    And se ordenan por fecha de creación
    And ninguno sobrescribe al otro
```

---

## HU-03 — Consultar dashboard y tickets respetando permisos y datos activos

**Como** usuario autenticado,  
**quiero** consultar métricas y listados de tickets según mi rol y alcance,  
**para** tomar decisiones operativas sin ver información no autorizada ni métricas distorsionadas.

```gherkin
Feature: Dashboard y filtros con visibilidad por permisos

  Background:
    Given existen tickets con distintos estados, prioridades, responsables, creadores, etiquetas y fechas
    And existen tickets activos y archivados
    And el usuario se encuentra autenticado

  Scenario: Administrador consulta dashboard global
    Given el usuario tiene rol "admin"
    When abre el dashboard
    Then el sistema muestra métricas globales
    And incluye total de tickets por estado
    And incluye tickets cerrados por mes
    And incluye tickets activos por usuario asignado
    And incluye tickets bloqueados
    And incluye tiempo básico desde creación hasta cierre

  Scenario: Usuario normal consulta dashboard limitado
    Given el usuario tiene rol "user"
    When abre el dashboard
    Then el sistema muestra únicamente métricas relacionadas con sus tickets o tickets visibles
    And no expone información fuera de su alcance

  Scenario: Excluir tickets archivados de métricas activas
    Given existen tickets archivados
    When el sistema calcula tickets activos
    Then excluye los tickets archivados
    And no los cuenta como trabajo activo

  Scenario: Contar ticket como cerrado
    Given existe un ticket en estado "done"
    When el sistema calcula tickets cerrados
    Then cuenta el ticket como cerrado
    And usa la fecha de cierre para métricas mensuales

  Scenario: Consultar tickets con filtros principales
    Given el usuario tiene acceso a la vista de tickets
    When filtra por estado, prioridad, responsable, creador, etiqueta, fecha de creación o archivado
    Then el sistema devuelve únicamente tickets dentro del alcance del usuario
    And aplica los filtros solicitados

  Scenario: Buscar tickets por título
    Given existen tickets visibles para el usuario
    When busca tickets por título
    Then el sistema muestra coincidencias dentro de su alcance
    And excluye tickets no autorizados

  Scenario: Consultar tickets archivados desde vista secundaria
    Given existen tickets archivados
    When el usuario accede a la vista secundaria de archivados
    Then el sistema muestra únicamente tickets archivados visibles para su rol
    And mantiene ocultos los tickets archivados en vistas principales
```
