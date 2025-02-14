package main

import (
	"log"
	"task-manager-backend/api/handlers"
	"task-manager-backend/api/middleware"
	"task-manager-backend/config"
	"task-manager-backend/internal/database"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Cargar configuración
	config.LoadEnv()

	// Inicializar conexión a ScyllaDB
	session := database.InitDB()
	defer session.Close()

	// Crear tablas si no existen
	if err := database.CreateTables(); err != nil {
		log.Fatal(err)
	}

	// Configurar router
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true, // Importante para cookies
		AllowOriginFunc: func(origin string) bool {
			return origin == "http://localhost:5173"
		},
		MaxAge: 12 * time.Hour,
	}))

	// Rutas
	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Rutas protegidas
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/user", handlers.GetUser)

			// Rutas protegidas adicionales
			protected.GET("/tasks", handlers.GetUserTasks)
			protected.POST("/tasks", handlers.CreateTask)
			protected.PUT("/tasks/:id", handlers.UpdateTask)
			protected.DELETE("/tasks/:id", handlers.DeleteTask)
		}
	}

	// Iniciar servidor
	r.Run(":8080")
}
