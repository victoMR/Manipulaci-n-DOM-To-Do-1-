import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  Progress,
  Button,
  Spin,
  message,
  Tag,
} from 'antd';
import {
  CheckCircleTwoTone,
  TrophyOutlined,
  BellFilled,
  FolderOutlined,
  FireOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import MainLayout from '../../layouts/MainLayout';

const { Title, Text } = Typography;

const API_BASE_URL = 'http://localhost:8080/api';


// Move formatDate outside of components so it's accessible to all
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Status display configurations - moved outside so it's accessible to all components
const statusConfig = {
  pending: {
    title: 'Pendientes',
    icon: <FireOutlined style={{ color: '#fa541c' }} />,
    color: '#fff2e8',
    borderColor: '#ffbb96',
  },
  in_progress: {
    title: 'En Progreso',
    icon: <SyncOutlined spin style={{ color: '#1890ff' }} />,
    color: '#e6f7ff',
    borderColor: '#91d5ff',
  },
  completed: {
    title: 'Completadas',
    icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
    color: '#f6ffed',
    borderColor: '#b7eb8f',
  },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch tasks from the backend
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('No token found. Please log in.');
        window.location.href = '/login';
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let fetchedTasks = [];
      if (response.data && response.data.tasks) {
        fetchedTasks = response.data.tasks;
        if (fetchedTasks.length === 1 && Array.isArray(fetchedTasks[0])) {
          fetchedTasks = fetchedTasks[0];
        }
      } else if (Array.isArray(response.data)) {
        fetchedTasks = response.data;
      }

      fetchedTasks = fetchedTasks.map(task => ({
        ...task,
        id: String(task.id), // Ensure id is a string
      }));

      //console.log('Processed Tasks:', fetchedTasks);
      setTasks(fetchedTasks);
    } catch (error) {
      message.error(`Failed to fetch tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    const taskToMove = tasks.find(task => task.id === active.id);
    setActiveTask(taskToMove);
  };

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    // Find the task being dragged
    const task = tasks.find((task) => task.id === active.id);
    if (!task) {
      console.error('Task not found with id:', active.id);
      return;
    }

    // Get the drop target ID
    const overId = over.id.toString();

    // Extract status from the drop target ID (droppable-pending → pending)
    const newStatus = overId.replace('droppable-', '');

    // Only update if the status has changed
    if (task.status === newStatus) return;

    // console.log(`Moving task "${task.title}" from ${task.status} to ${newStatus}`);

    // Create updated task with new status
    const updatedTask = { ...task, status: newStatus };

    // Update local state optimistically
    const newTasks = tasks.map((t) => (t.id === task.id ? updatedTask : t));
    setTasks(newTasks);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/tasks/${task.id}`, updatedTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Estado de la tarea actualizado correctamente');
    } catch (error) {
      message.error(`Error al actualizar la tarea: ${error.message}`);
      // Revert local state in case of error
      setTasks(tasks);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Group tasks by status
  const tasksByStatus = {
    pending: tasks.filter((task) => task.status === 'pending'),
    in_progress: tasks.filter((task) => task.status === 'in_progress'),
    completed: tasks.filter((task) => task.status === 'completed'),
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '24px' }}>
        <Row gutter={[24, 24]} align="middle" justify="space-between" style={{ marginBottom: '24px' }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              Panel de Control
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Resumen de tus tareas y actividades {` - ${new Date().toLocaleString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}`}
            </Text>
          </Col>
          <Col>
            <Button type="primary" onClick={() => navigate('/tasks')} size="large">
              Gestionar Tareas
            </Button>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" hoverable>
              <Statistic
                title="Total de Tareas"
                value={tasks.length}
                prefix={<TrophyOutlined style={{ color: '#722ED1' }} />}
                valueStyle={{ color: '#722ED1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" hoverable>
              <Statistic
                title="Completadas"
                value={tasksByStatus.completed.length}
                prefix={<CheckCircleTwoTone twoToneColor="#52c41a" />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Progress
                percent={tasks.length ? Math.round((tasksByStatus.completed.length / tasks.length) * 100) : 0}
                strokeColor="#52c41a"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" hoverable>
              <Statistic
                title="En Progreso"
                value={tasksByStatus.in_progress.length}
                prefix={<SyncOutlined spin style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" hoverable>
              <Statistic
                title="Con Recordatorio"
                value={tasks.filter((task) => task.remind_me).length}
                prefix={<BellFilled style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Row gutter={[24, 24]}>
            {Object.entries(statusConfig).map(([status, config]) => (
              <Col xs={24} md={8} key={status}>
                <DroppableStatusColumn
                  status={status}
                  config={config}
                  tasks={tasksByStatus[status]}
                />
              </Col>
            ))}
          </Row>
          <DragOverlay>
            {activeId && activeTask ? (
              <TaskCard
                task={activeTask}
                status={activeTask.status}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </MainLayout>
  );
};

// New component for droppable columns with proper useDroppable hook
const DroppableStatusColumn = ({ status, config, tasks }) => {
  // Use the useDroppable hook to make this column a drop target
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${status}`,
  });

  // Apply a highlight style when dragging over this column
  const dropStyle = isOver ? {
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
    border: `2px solid ${config.borderColor}`,
  } : {};

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {config.icon}
          <Text strong style={{ marginLeft: '8px' }}>
            {config.title} ({tasks.length})
          </Text>
        </div>
      }
      className="dashboard-card"
      style={{
        backgroundColor: config.color,
        minHeight: '300px',
        ...dropStyle
      }}
      variant="bordered"
      styles={{ body: { padding: '12px', minHeight: '300px' } }}
    >
      <div ref={setNodeRef} style={{ minHeight: '240px' }}>
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100px',
                color: '#999',
                borderRadius: '6px',
                border: '2px dashed #ddd',
                margin: '8px 0',
              }}
            >
              No hay tareas en esta sección
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTask
                key={task.id}
                id={task.id}
                task={task}
                status={status}
              />
            ))
          )}
        </SortableContext>
      </div>
    </Card>
  );
};

const SortableTask = ({ id, task, status }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      task,
      status
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} status={status} isDragging={isDragging} />
    </div>
  );
};

// Extracted Task Card component for reuse in DragOverlay
const TaskCard = ({ task, status, isDragging }) => {
  return (
    <div
      style={{
        marginBottom: '12px',
        padding: '12px',
        backgroundColor: 'white',
        borderRadius: '6px',
        boxShadow: isDragging ? '0 5px 15px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderLeft: `4px solid ${task.remind_me ? '#faad14' : statusConfig[status].borderColor}`,
        transition: 'all 0.2s',
        cursor: 'grab',
        width: 'auto',
      }}
    >
      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
        {task.title}
      </Text>
      {task.description && (
        <Text
          type="secondary"
          style={{
            display: 'block',
            marginBottom: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {task.description}
        </Text>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <Tag icon={<FolderOutlined />} color="processing">
          {task.category}
        </Tag>
        {task.remind_me && (
          <Tag icon={<BellFilled />} color="warning">
            Recordatorio
          </Tag>
        )}
      </div>
      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px' }}>
        Creada: {formatDate(task.created_at)}
      </Text>
    </div>
  );
};

export default DashboardPage;
