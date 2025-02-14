// src/pages/Profile/ProfilePage.jsx
import MainLayout from '../../layouts/MainLayout';
import { Typography } from 'antd';

const { Title } = Typography;

const ProfilePage = () => {
  return (
    <MainLayout>
      <Title level={2}>Profile</Title>
      <p>Update your personal information here.</p>
    </MainLayout>
  );
};

export default ProfilePage;
