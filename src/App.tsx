/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Personnel } from './pages/Personnel';
import { Payroll } from './pages/Payroll';
import { CashFlow } from './pages/CashFlow';
import { Approvals } from './pages/Approvals';
import { Settings } from './pages/Settings';
import { ProjectBoard } from './pages/ProjectBoard';
import { ProjectBonuses } from './pages/ProjectBonuses';
import { SprintReport } from './pages/SprintReport';
import { Contracts } from './pages/Contracts';
import { Customers } from './pages/Customers';

import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
          <Route path="projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="projects/:id/board" element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
          <Route path="projects/:id/bonuses" element={<ProtectedRoute><ProjectBonuses /></ProtectedRoute>} />
          <Route path="projects/:id/sprint-report" element={<ProtectedRoute><SprintReport /></ProtectedRoute>} />
          <Route path="personnel" element={<ProtectedRoute><Personnel /></ProtectedRoute>} />
          <Route path="payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
          <Route path="cashflow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
          <Route path="approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
