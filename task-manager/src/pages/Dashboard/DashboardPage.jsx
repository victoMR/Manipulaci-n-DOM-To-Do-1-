// src/pages/Dashboard/DashboardPage.jsx
import { Card, Row, Col, Typography } from 'antd';
import { CheckCircleTwoTone, UserOutlined, SettingTwoTone } from '@ant-design/icons';
import MainLayout from '../../layouts/MainLayout';

const { Title } = Typography;

const DashboardPage = () => {
  return (
    <MainLayout>
      <Title level={2} style={{ color: '#2F54EB', textAlign: 'center', marginBottom: 24 }}>
        Welcome to Your Dashboard
      </Title>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ textAlign: 'center' }}>
            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '48px', marginBottom: 16 }} />
            <Title level={4}>Tasks</Title>
            <p>Manage and track your tasks easily.</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ textAlign: 'center' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>Profile</Title>
            <p>View and edit your profile information.</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card hoverable style={{ textAlign: 'center' }}>
            <SettingTwoTone twoToneColor="#eb2f96" style={{ fontSize: '48px', marginBottom: 16 }} />
            <Title level={4}>Settings</Title>
            <p>Configure your app preferences.</p>
          </Card>
        </Col>
      </Row>
    </MainLayout>
  );
};

export default DashboardPage;
