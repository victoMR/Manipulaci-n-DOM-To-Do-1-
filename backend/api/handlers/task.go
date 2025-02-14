package handlers

import (
	"net/http"
	"task-manager-backend/internal/database"
	"task-manager-backend/internal/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gocql/gocql"
)

// CreateTaskRequest estructura para la creación de tareas
type CreateTaskRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	Status      string `json:"status" binding:"required"`
}

// UpdateTaskRequest estructura para actualizar tareas
type UpdateTaskRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

// CreateTask maneja la creación de nuevas tareas
func CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Obtener el ID del usuario del contexto (establecido por el middleware de autenticación)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Convertir userID a UUID
	userUUID, err := gocql.ParseUUID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Crear nueva tarea
	task := &models.Task{
		ID:          gocql.TimeUUID(),
		UserID:      userUUID,
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Insertar tarea en la base de datos
	if err := database.Session.Query(`
		INSERT INTO tasks (id, user_id, title, description, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		task.ID, task.UserID, task.Title, task.Description, task.Status, task.CreatedAt, task.UpdatedAt,
	).Exec(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating task"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"task": task})
}

// GetUserTasks obtiene todas las tareas del usuario
func GetUserTasks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	userUUID, err := gocql.ParseUUID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Consultar tareas del usuario
	iter := database.Session.Query(`
		SELECT id, user_id, title, description, status, created_at, updated_at
		FROM tasks
		WHERE user_id = ?`,
		userUUID,
	).Iter()

	var tasks []models.Task
	var task models.Task
	for iter.Scan(
		&task.ID,
		&task.UserID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.CreatedAt,
		&task.UpdatedAt,
	) {
		tasks = append(tasks, task)
	}

	if err := iter.Close(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching tasks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// UpdateTask actualiza una tarea existente
func UpdateTask(c *gin.Context) {
	taskID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	taskUUID, err := gocql.ParseUUID(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	userUUID, err := gocql.ParseUUID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verificar que la tarea pertenece al usuario
	var existingTask models.Task
	if err := database.Session.Query(`
		SELECT id FROM tasks WHERE id = ? AND user_id = ? ALLOW FILTERING`,
		taskUUID, userUUID,
	).Scan(&existingTask.ID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or unauthorized"})
		return
	}

	// Actualizar la tarea
	if err := database.Session.Query(`
		UPDATE tasks
		SET title = ?, description = ?, status = ?, updated_at = ?
		WHERE id = ? AND user_id = ?`,
		req.Title, req.Description, req.Status, time.Now(), taskUUID, userUUID,
	).Exec(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
}

// DeleteTask elimina una tarea
func DeleteTask(c *gin.Context) {
	taskID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	taskUUID, err := gocql.ParseUUID(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	userUUID, err := gocql.ParseUUID(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verificar que la tarea pertenece al usuario antes de eliminarla
	var existingTask models.Task
	if err := database.Session.Query(`
		SELECT id FROM tasks WHERE id = ? AND user_id = ? ALLOW FILTERING`,
		taskUUID, userUUID,
	).Scan(&existingTask.ID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or unauthorized"})
		return
	}

	// Eliminar la tarea
	if err := database.Session.Query(`
		DELETE FROM tasks WHERE id = ? AND user_id = ?`,
		taskUUID, userUUID,
	).Exec(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
