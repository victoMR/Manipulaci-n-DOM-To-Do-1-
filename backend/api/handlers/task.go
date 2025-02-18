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
	Title           string        `json:"title" binding:"required"`
	Description     string        `json:"description" binding:"required"`
	Status          string        `json:"status" binding:"required"`
	TimeUntilFinish time.Duration `json:"time_until_finish"`
	RemindMe        bool          `json:"remind_me"`
	Category        string        `json:"category"`
}

type UpdateTaskRequest struct {
	Title           string        `json:"title"`
	Description     string        `json:"description"`
	Status          string        `json:"status"`
	TimeUntilFinish time.Duration `json:"time_until_finish"`
	RemindMe        bool          `json:"remind_me"`
	Category        string        `json:"category"`
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
		ID:              uuid.New().String(),
		UserID:          userID.(string),
		Title:           req.Title,
		Description:     req.Description,
		Status:          req.Status,
		TimeUntilFinish: req.TimeUntilFinish,
		RemindMe:        req.RemindMe,
		Category:        req.Category,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
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
	docs, err := tasksRef.Where("user_id", "==", userID.(string)).Documents(ctx).GetAll()

	if err != nil {
		log.Printf("Error fetching tasks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching tasks"})
		return
	}

	var tasks []models.Task
	for _, doc := range docs {
		var task models.Task
		if err := doc.DataTo(&task); err != nil {
			log.Printf("Error converting document to task: %v", err)
			continue
		}
		tasks = append(tasks, task)
	}

	c.JSON(http.StatusOK, gin.H{"tasks": tasks})
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

	var existingTask models.Task
	if err := doc.DataTo(&existingTask); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing task data"})
		return
	}

	if existingTask.UserID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized to modify this task"})
		return
	}

	updates := make(map[string]interface{})
	updates["updated_at"] = time.Now()

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
	// Update new fields
	updates["time_until_finish"] = req.TimeUntilFinish
	updates["remind_me"] = req.RemindMe
	if req.Category != "" {
		updates["category"] = req.Category
	}

	// Validate updated task
	if !existingTask.Validate() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task data"})
		return
	}

	_, err = taskRef.Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		log.Printf("Error updating task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task updated successfully"})
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
