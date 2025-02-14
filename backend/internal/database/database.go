package database

import (
	"log"
	"strings"
	"task-manager-backend/config"
	"time"

	"github.com/gocql/gocql"
)

var Session *gocql.Session // Variable global para la sesión

func InitDB() *gocql.Session {
	// Obtener configuración desde variables de entorno
	hosts := strings.Split(config.GetEnv("SCYLLA_HOSTS", "127.0.0.1:9042"), ",")
	username := config.GetEnv("SCYLLA_USERNAME", "")
	password := config.GetEnv("SCYLLA_PASSWORD", "")

	cluster := gocql.NewCluster(hosts...)
	cluster.Keyspace = "task_man"
	cluster.Consistency = gocql.Quorum
	cluster.Timeout = time.Second * 5

	// Si hay usuario y contraseña, configurar autenticación
	if username != "" && password != "" {
		cluster.Authenticator = gocql.PasswordAuthenticator{
			Username: username,
			Password: password,
		}
	}

	// Seleccionar política de hosts (opcional, pero recomendado en entornos distribuidos)
	cluster.PoolConfig.HostSelectionPolicy = gocql.DCAwareRoundRobinPolicy("AWS_US_EAST_1")

	var err error
	Session, err = cluster.CreateSession()
	if err != nil {
		log.Fatal("Error al conectar con ScyllaDB:", err)
	}

	return Session
}

func CreateTables() error {
	// Crear keyspace si no existe
	if err := Session.Query(`CREATE KEYSPACE IF NOT EXISTS task_man
		WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`).Exec(); err != nil {
		return err
	}

	// Crear tabla de usuarios
	if err := Session.Query(`CREATE TABLE IF NOT EXISTS task_man.users (
		id uuid PRIMARY KEY,
		username text,
		email text,
		password text,
		created_at timestamp
	)`).Exec(); err != nil {
		return err
	}

	// Crear tabla de tareas
	if err := Session.Query(`CREATE TABLE IF NOT EXISTS task_man.tasks (
		id uuid,
		user_id uuid,
		title text,
		description text,
		status text,
		created_at timestamp,
		updated_at timestamp,
		PRIMARY KEY (user_id, id)
	)`).Exec(); err != nil {
		return err
	}

	return nil
}
