# Mini Jira Docs

Documentacion tecnica generada por orquestacion de subagentes.

## Secciones

| Documento | Contenido |
| --- | --- |
| [API Reference](api-reference.md) | Endpoints REST, autenticacion, status codes y ejemplos `curl` P0. |
| [Diagramas](diagramas.md) | Diagramas Mermaid para autenticacion, movimiento de tickets y ciclo de vida. |
| [Cobertura de Tests](cobertura-tests.md) | Auditoria de historias Gherkin contra tests existentes y deuda tecnica. |
| [Base de Datos](base-de-datos.md) | ERD Mermaid, tablas, constraints y decisiones de diseno del esquema. |

## Notas de generacion

- Los documentos fueron producidos por 4 subagentes ejecutados en paralelo.
- La integracion final agrega esta pagina de inicio y `mkdocs.yml`.
- Algunas secciones documentan discrepancias del workspace, como la ausencia de `apps/api/`, `src/db/schema.ts` o un endpoint JWT refresh en el contrato actual.
