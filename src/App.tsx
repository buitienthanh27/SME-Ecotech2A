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

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id/board" element={<ProjectBoard />} />
          <Route path="projects/:id/bonuses" element={<ProjectBonuses />} />
          <Route path="projects/:id/sprint-report" element={<SprintReport />} />
          <Route path="personnel" element={<Personnel />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="cashflow" element={<CashFlow />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
