# Project Context

## Database (PostgreSQL)

### Enums

- `user_role` — `'employer'` | `'employee'`
- `app_language` — `'es'` | `'en'` | `'fr'`

### Tables

#### `address`

| Column         | Type    | Notes                   |
| -------------- | ------- | ----------------------- |
| id             | UUID PK | auto uuid_generate_v4() |
| country        | TEXT    |                         |
| state          | TEXT    |                         |
| city           | TEXT    |                         |
| postal_code    | TEXT    |                         |
| address_line_1 | TEXT    |                         |
| address_line_2 | TEXT    |                         |

#### `skill`

| Column | Type    | Notes                   |
| ------ | ------- | ----------------------- |
| id     | UUID PK | auto uuid_generate_v4() |
| name   | TEXT    | NOT NULL, UNIQUE        |

#### `app_user`

| Column     | Type         | Notes                             |
| ---------- | ------------ | --------------------------------- |
| id         | UUID PK      | auto uuid_generate_v4()           |
| email      | TEXT         | UNIQUE, NOT NULL                  |
| phone      | TEXT         |                                   |
| full_name  | TEXT         | NOT NULL                          |
| role       | user_role    | NOT NULL                          |
| avatar_url | TEXT         |                                   |
| language   | app_language | NOT NULL, DEFAULT 'es'            |
| age        | INTEGER      |                                   |
| address_id | UUID FK      | → address(id), ON DELETE SET NULL |

#### `employer_user`

Extiende `app_user` para usuarios con rol `employer`.
| Column | Type | Notes |
|---|---|---|
| user_id | UUID PK FK | → app_user(id), ON DELETE CASCADE |
| description | TEXT | |

#### `employee_user`

Extiende `app_user` para usuarios con rol `employee`.
| Column | Type | Notes |
|---|---|---|
| user_id | UUID PK FK | → app_user(id), ON DELETE CASCADE |
| biography | TEXT | |
| is_looking_for_job | BOOLEAN | NOT NULL, DEFAULT TRUE |

#### `user_skill`

Tabla pivote: skills de un employee.
| Column | Type | Notes |
|---|---|---|
| user_id | UUID PK FK | → employee_user(user_id), ON DELETE CASCADE |
| skill_id | UUID PK FK | → skill(id), ON DELETE CASCADE |

#### `contracts`

Contratos entre empleadores y empleados.
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | auto uuid_generate_v4() |
| title | TEXT | NOT NULL |
| salary | NUMERIC(15, 2) | |
| start_date | DATE | |
| end_date | DATE | |
| status | TEXT | NOT NULL, valores: 'draft', 'sent', 'accepted', 'rejected' |
| employer_user_id | UUID FK | → app_user(id), ON DELETE CASCADE |
| employee_user_id | UUID FK | → app_user(id), ON DELETE CASCADE |
| employer_contract_url | TEXT | Ruta del archivo PDF del contrato del empleador |
| employee_contract_url | TEXT | Ruta del archivo PDF del contrato del empleado |
| sent_at | TIMESTAMP | Fecha cuando se envió el contrato |
| accepted_at | TIMESTAMP | Fecha cuando se aceptó el contrato |
| rejected_at | TIMESTAMP | Fecha cuando se rechazó el contrato |
| expires_at | TIMESTAMP | Fecha de vencimiento del contrato |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Relaciones clave

- Cada usuario tiene un perfil base en `app_user` y uno extendido en `employer_user` o `employee_user` según su `role`
- Solo los `employee_user` pueden tener skills (tabla `user_skill`)
- Un `app_user` puede tener una dirección opcional en `address`
- Todos los IDs son UUID, nunca enteros
