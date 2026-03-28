import React from 'react';
import { Routes, Route } from 'react-router';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Preview from './pages/Preview';
import Publish from './pages/Publish';
import Auth from './pages/Auth';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/preview/:taskId" element={<Preview />} />
        <Route path="/publish/:taskId" element={<Publish />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
