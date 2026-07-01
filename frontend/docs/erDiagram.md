erDiagram

    USUARIOS ||--o{ TICKETS : crea
    USUARIOS ||--o{ TICKETS : tiene_asignados
    USUARIOS ||--o{ COMENTARIOS : escribe
    TICKETS ||--o{ COMENTARIOS : contiene
    TICKETS ||--o{ TICKET_AUDIT_LOGS : registra
    USUARIOS ||--o{ TICKET_AUDIT_LOGS : realiza
    TICKETS ||--o{ NOTIFICATION_EVENTS : genera
    USUARIOS ||--o{ NOTIFICATION_EVENTS : recibe

    USUARIOS {
        uuid id PK
        string name
        string email
        string password_hash
        string role "admin | user"
        datetime created_at
        datetime updated_at
    }

    TICKETS {
        uuid id PK
        string title
        text description
        string status "todo | in_progress | review | blocked | done | archived"
        string priority
        string labels
        uuid creator_id FK
        uuid assignee_id FK
        datetime created_at
        datetime updated_at
        datetime closed_at
        datetime archived_at
        int version
    }

    COMENTARIOS {
        uuid id PK
        uuid ticket_id FK
        uuid author_id FK
        text body
        datetime created_at
        datetime updated_at
    }

    TICKET_AUDIT_LOGS {
        uuid id PK
        uuid ticket_id FK
        uuid user_id FK
        string field
        text old_value
        text new_value
        datetime created_at
    }

    NOTIFICATION_EVENTS {
        uuid id PK
        uuid ticket_id FK
        uuid recipient_id FK
        string event_type "ticket_assigned | user_mentioned | ticket_blocked"
        string status "pending | sent | failed"
        datetime sent_at
        datetime created_at
    }
