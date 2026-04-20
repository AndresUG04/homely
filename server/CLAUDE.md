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

### Relaciones clave

- Cada usuario tiene un perfil base en `app_user` y uno extendido en `employer_user` o `employee_user` según su `role`
- Solo los `employee_user` pueden tener skills (tabla `user_skill`)
- Un `app_user` puede tener una dirección opcional en `address`
- Todos los IDs son UUID, nunca enteros
