export const MAIN_GO = `package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	_ "modernc.org/sqlite" // pure-Go драйвер SQLite (без cgo)
)

// User — запись таблицы users.
type User struct {
	ID   int64  \`json:"id"\`
	Name string \`json:"name"\`
	Age  int    \`json:"age"\`
}

var db *sql.DB

func main() {
	var err error
	db, err = sql.Open("sqlite", "users.db")
	if err != nil {
		log.Fatal("не удалось открыть БД: ", err)
	}
	defer db.Close()

	if err := initDB(); err != nil {
		log.Fatal("не удалось инициализировать БД: ", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /users", listUsers)         // получить все записи
	mux.HandleFunc("GET /users/{id}", getUser)      // получить одну по ID
	mux.HandleFunc("POST /users", createUser)       // добавить запись
	mux.HandleFunc("PUT /users/{id}", updateUser)   // отредактировать запись
	mux.HandleFunc("DELETE /users/{id}", deleteUser) // удалить запись

	handler := withCORS(withLog(mux))

	addr := ":8080"
	log.Printf("сервер запущен: http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}

// initDB создаёт таблицу users и наполняет её демо-данными.
func initDB() error {
	schema := \`
CREATE TABLE IF NOT EXISTS users (
	id   INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT    NOT NULL CHECK (length(name) > 0),
	age  INTEGER NOT NULL CHECK (age BETWEEN 0 AND 150)
);\`
	if _, err := db.Exec(schema); err != nil {
		return err
	}

	var count int
	if err := db.QueryRow(\`SELECT COUNT(*) FROM users\`).Scan(&count); err != nil {
		return err
	}
	if count == 0 { // наполняем таблицу при первом запуске
		seed := []User{{Name: "Иван", Age: 31}, {Name: "Мария", Age: 24}, {Name: "Пётр", Age: 47}}
		for _, u := range seed {
			if _, err := db.Exec(\`INSERT INTO users (name, age) VALUES (?, ?)\`, u.Name, u.Age); err != nil {
				return err
			}
		}
	}
	return nil
}

// ---------- обработчики ----------

// GET /users — получить все записи таблицы.
func listUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(\`SELECT id, name, age FROM users ORDER BY id\`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось получить данные")
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.Age); err != nil {
			writeError(w, http.StatusInternalServerError, "ошибка чтения строки")
			return
		}
		users = append(users, u)
	}
	writeJSON(w, http.StatusOK, users)
}

// GET /users/{id} — получить одну запись по ID.
func getUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "некорректный ID")
		return
	}

	var u User
	err = db.QueryRow(\`SELECT id, name, age FROM users WHERE id = ?\`, id).Scan(&u.ID, &u.Name, &u.Age)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "пользователь не найден")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось получить данные")
		return
	}
	writeJSON(w, http.StatusOK, u)
}

// POST /users — добавить запись. Тело: {"name": "...", "age": N}
func createUser(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name string \`json:"name"\`
		Age  int    \`json:"age"\`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "некорректное JSON-тело")
		return
	}
	if err := validate(in.Name, in.Age); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := db.Exec(\`INSERT INTO users (name, age) VALUES (?, ?)\`, in.Name, in.Age)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось создать запись")
		return
	}
	id, _ := res.LastInsertId()

	writeJSON(w, http.StatusCreated, User{ID: id, Name: in.Name, Age: in.Age})
}

// PUT /users/{id} — отредактировать запись по ID.
func updateUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "некорректный ID")
		return
	}

	var in struct {
		Name string \`json:"name"\`
		Age  int    \`json:"age"\`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "некорректное JSON-тело")
		return
	}
	if err := validate(in.Name, in.Age); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	res, err := db.Exec(\`UPDATE users SET name = ?, age = ? WHERE id = ?\`, in.Name, in.Age, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось обновить запись")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "пользователь не найден")
		return
	}
	writeJSON(w, http.StatusOK, User{ID: id, Name: in.Name, Age: in.Age})
}

// DELETE /users/{id} — удалить запись по ID.
func deleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "некорректный ID")
		return
	}

	res, err := db.Exec(\`DELETE FROM users WHERE id = ?\`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось удалить запись")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "пользователь не найден")
		return
	}
	w.WriteHeader(http.StatusNoContent) // 204: удалено, тела нет
}

// ---------- вспомогательные функции ----------

// validate проверяет поля name и age.
func validate(name string, age int) error {
	if strings.TrimSpace(name) == "" {
		return errors.New(\`поле "name" не должно быть пустым\`)
	}
	if age < 0 || age > 150 {
		return errors.New(\`поле "age" должно быть от 0 до 150\`)
	}
	return nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// withLog — middleware: логирует метод, путь и время выполнения.
func withLog(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s — %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// withCORS — разрешает запросы из браузера (для локальной разработки).
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
`;

export const GO_MOD = `module users-api

go 1.22

require modernc.org/sqlite v1.34.5
`;

export const SCHEMA_SQL = `-- Таблица users: одна запись = один пользователь.
-- SQLite создаст файл users.db автоматически при первом запуске.

CREATE TABLE IF NOT EXISTS users (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,  -- уникальный ключ, выдаётся сам
    name TEXT    NOT NULL CHECK (length(name) > 0),
    age  INTEGER NOT NULL CHECK (age BETWEEN 0 AND 150)
);

-- Быстрая проверка всех CRUD-операций через sqlite3:
-- SELECT * FROM users;
-- INSERT INTO users (name, age) VALUES ('Анна', 24);
-- UPDATE users SET age = 25 WHERE id = 1;
-- DELETE FROM users WHERE id = 2;
`;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  title: string;
  desc: string;
  request?: { body?: string; note?: string };
  response: { status: string; body: string };
  curl: string;
}

export const ENDPOINTS: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/users",
    title: "Получить все записи",
    desc: "Возвращает массив всех пользователей таблицы, отсортированный по id. Если таблица пуста — пустой массив [], а не null.",
    response: {
      status: "200 OK",
      body: `[
  { "id": 1, "name": "Иван",  "age": 31 },
  { "id": 2, "name": "Мария", "age": 24 },
  { "id": 3, "name": "Пётр",  "age": 47 }
]`,
    },
    curl: `curl http://localhost:8080/users`,
  },
  {
    method: "GET",
    path: "/users/{id}",
    title: "Получить одну запись",
    desc: "Возвращает пользователя с указанным id. Если записи нет — 404, если id не число — 400.",
    request: { note: "id передаётся прямо в пути: /users/2" },
    response: {
      status: "200 OK",
      body: `{ "id": 2, "name": "Мария", "age": 24 }`,
    },
    curl: `curl http://localhost:8080/users/2`,
  },
  {
    method: "POST",
    path: "/users",
    title: "Добавить запись",
    desc: "Создаёт нового пользователя. Сервер сам проверяет поля: name не пустое, age от 0 до 150. Новый id возвращается в ответе со статусом 201.",
    request: { body: `{ "name": "Анна", "age": 24 }` },
    response: {
      status: "201 Created",
      body: `{ "id": 4, "name": "Анна", "age": 24 }`,
    },
    curl: `curl -X POST http://localhost:8080/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Анна","age":24}'`,
  },
  {
    method: "PUT",
    path: "/users/{id}",
    title: "Отредактировать запись",
    desc: "Полностью обновляет name и age записи с указанным id. Проверки те же, что у POST. Если записи нет — 404.",
    request: { body: `{ "name": "Анна", "age": 25 }` },
    response: {
      status: "200 OK",
      body: `{ "id": 4, "name": "Анна", "age": 25 }`,
    },
    curl: `curl -X PUT http://localhost:8080/users/4 \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Анна","age":25}'`,
  },
  {
    method: "DELETE",
    path: "/users/{id}",
    title: "Удалить запись",
    desc: "Удаляет запись по id и возвращает 204 No Content без тела. Если записи с таким id нет — 404.",
    request: { note: "тело запроса не требуется" },
    response: {
      status: "204 No Content",
      body: `(пустое тело)`,
    },
    curl: `curl -X DELETE http://localhost:8080/users/3`,
  },
];

export const SEED_USERS = [
  { id: 1, name: "Иван", age: 31 },
  { id: 2, name: "Мария", age: 24 },
  { id: 3, name: "Пётр", age: 47 },
];

export const RANDOM_NAMES = [
  "Анна", "Олег", "Дарья", "Никита", "Алиса", "Егор",
  "Софья", "Тимур", "Вера", "Глеб", "Кира", "Лев",
];
