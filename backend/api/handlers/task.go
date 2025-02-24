// backend/api/handlers/task.go
package handlers

import (
	"context"
	"log"
	"net/http"
	"task-manager-backend/internal/database"
	"task-manager-backend/internal/models"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type CreateTaskRequest struct {
	Title            string        `json:"title" binding:"required"`
	Description      string        `json:"description" binding:"required"`
	Status           string        `json:"status" binding:"required"`
	TimeUntilFinish  time.Duration `json:"time_until_finish"`
	RemindMe         bool          `json:"remind_me"`
	Category         string        `json:"category"`
	GroupID          *string       `json:"group_id,omitempty"`          // ID del grupo (opcional)
	AssignedTo       *string       `json:"assigned_to,omitempty"`       // ID del usuario asignado (opcional)
	ArrCollaborators []string      `json:"arr_collaborators,omitempty"` // IDs de colaboradores (opcional)
}

type UpdateTaskRequest struct {
	Title            string        `json:"title"`
	Description      string        `json:"description"`
	Status           string        `json:"status"`
	TimeUntilFinish  time.Duration `json:"time_until_finish"`
	RemindMe         bool          `json:"remind_me"`
	Category         string        `json:"category"`
	GroupID          *string       `json:"group_id,omitempty"`          // ID del grupo (opcional)
	AssignedTo       *string       `json:"assigned_to,omitempty"`       // ID del usuario asignado (opcional)
	ArrCollaborators []string      `json:"arr_collaborators,omitempty"` // IDs de colaboradores (opcional)
}

func CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Datos de la tarea recibidos: %+v", req)

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	task := models.Task{
		ID:               uuid.New().String(),
		UserID:           userID.(string),
		Title:            req.Title,
		Description:      req.Description,
		Status:           req.Status,
		TimeUntilFinish:  req.TimeUntilFinish,
		RemindMe:         req.RemindMe,
		Category:         req.Category,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		CreatedBy:        userID.(string),      // El usuario que crea la tarea
		GroupID:          req.GroupID,          // ID del grupo (puede ser nil)
		AssignedTo:       req.AssignedTo,       // ID del usuario asignado (puede ser nil)
		ArrCollaborators: req.ArrCollaborators, // IDs de colaboradores
	}

	// Validate task before saving
	if !task.Validate() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task data"})
		return
	}

	ctx := context.Background()
	_, err := database.Client.Collection("tasks").Doc(task.ID).Set(ctx, task)

	if err != nil {
		log.Printf("Error creating task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating task"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"task": task})
}

func GetUserTasks(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	ctx := context.Background()
	tasksRef := database.Client.Collection("tasks")

	// Consulta para obtener las tareas donde el usuario es el propietario
	queryOwner := tasksRef.Where("user_id", "==", userID.(string))

	// Consulta para obtener las tareas donde el usuario es un colaborador
	queryCollaborator := tasksRef.Where("arr_collaborators", "array-contains", userID.(string))

	// Ejecutar ambas consultas en paralelo
	docsOwner, errOwner := queryOwner.Documents(ctx).GetAll()
	docsCollaborator, errCollaborator := queryCollaborator.Documents(ctx).GetAll()

	// Manejar errores
	if errOwner != nil {
		log.Printf("Error fetching tasks where user is owner: %v", errOwner)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching tasks where user is owner"})
		return
	}
	if errCollaborator != nil {
		log.Printf("Error fetching tasks where user is collaborator: %v", errCollaborator)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching tasks where user is collaborator"})
		return
	}

	// Combinar los resultados de ambas consultas
	var tasks []models.Task

	// Procesar tareas donde el usuario es el propietario
	for _, doc := range docsOwner {
		var task models.Task
		if err := doc.DataTo(&task); err != nil {
			log.Printf("Error converting document to task: %v", err)
			continue
		}
		tasks = append(tasks, task)
	}

	// Procesar tareas donde el usuario es un colaborador
	for _, doc := range docsCollaborator {
		var task models.Task
		if err := doc.DataTo(&task); err != nil {
			log.Printf("Error converting document to task: %v", err)
			continue
		}
		tasks = append(tasks, task)
	}

	// Eliminar duplicados (en caso de que el usuario sea tanto el propietario como un colaborador)
	uniqueTasks := removeDuplicateTasks(tasks)

	c.JSON(http.StatusOK, gin.H{"tasks": uniqueTasks})
}

// Función para eliminar tareas duplicadas
func removeDuplicateTasks(tasks []models.Task) []models.Task {
	seen := make(map[string]bool)
	var uniqueTasks []models.Task

	for _, task := range tasks {
		if !seen[task.ID] {
			seen[task.ID] = true
			uniqueTasks = append(uniqueTasks, task)
		}
	}

	return uniqueTasks
}

// Función helper para revisar si un string se encuentra en un slice de strings
func contains(arr []string, str string) bool {
	for _, s := range arr {
		if s == str {
			return true
		}
	}
	return false
}

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

	ctx := context.Background()
	taskRef := database.Client.Collection("tasks").Doc(taskID)

	// Obtener la tarea existente
	doc, err := taskRef.Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching task"})
		return
	}

	var existingTask models.Task
	if err := doc.DataTo(&existingTask); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing task data"})
		return
	}

	// Verificar si el usuario es el propietario o un colaborador
	isOwner := existingTask.UserID == userID.(string)
	isCollaborator := contains(existingTask.ArrCollaborators, userID.(string))

	if !isOwner && !isCollaborator {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized to modify this task"})
		return
	}

	// Definir los campos que se pueden actualizar
	updates := make(map[string]interface{})
	updates["updated_at"] = time.Now()

	if isOwner {
		// El propietario puede modificar todos los campos
		if req.Title != "" {
			updates["title"] = req.Title
			existingTask.Title = req.Title
		}
		if req.Description != "" {
			updates["description"] = req.Description
			existingTask.Description = req.Description
		}
		if req.Status != "" {
			updates["status"] = req.Status
			existingTask.Status = req.Status
		}
		if req.TimeUntilFinish != 0 {
			updates["time_until_finish"] = req.TimeUntilFinish
			existingTask.TimeUntilFinish = req.TimeUntilFinish
		}
		if req.Category != "" {
			updates["category"] = req.Category
			existingTask.Category = req.Category
		}
		if req.GroupID != nil {
			updates["group_id"] = req.GroupID
			existingTask.GroupID = req.GroupID
		}
		if req.AssignedTo != nil {
			updates["assigned_to"] = req.AssignedTo
			existingTask.AssignedTo = req.AssignedTo
		}
		if req.ArrCollaborators != nil {
			updates["arr_collaborators"] = req.ArrCollaborators
			existingTask.ArrCollaborators = req.ArrCollaborators
		}
	} else if isCollaborator {
		// El colaborador solo puede modificar ciertos campos
		if req.Title != "" {
			updates["title"] = req.Title
			existingTask.Title = req.Title
		}
		if req.Description != "" {
			updates["description"] = req.Description
			existingTask.Description = req.Description
		}
		if req.Status != "" {
			updates["status"] = req.Status
			existingTask.Status = req.Status
		}
		if req.TimeUntilFinish != 0 {
			updates["time_until_finish"] = req.TimeUntilFinish
			existingTask.TimeUntilFinish = req.TimeUntilFinish
		}
		if req.Category != "" {
			updates["category"] = req.Category
			existingTask.Category = req.Category
		}
	}

	// Validar la tarea actualizada
	if !existingTask.Validate() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task data"})
		return
	}

	// Actualizar la tarea en Firestore
	_, err = taskRef.Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		log.Printf("Error updating task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully", "task": existingTask})
}

func DeleteTask(c *gin.Context) {
	taskID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	ctx := context.Background()
	taskRef := database.Client.Collection("tasks").Doc(taskID)

	// Verify task exists and belongs to user
	doc, err := taskRef.Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching task"})
		return
	}

	var task models.Task
	if err := doc.DataTo(&task); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing task data"})
		return
	}

	if task.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized to delete this task"})
		return
	}

	_, err = taskRef.Delete(ctx)
	if err != nil {
		log.Printf("Error deleting task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
