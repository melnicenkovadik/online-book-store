"use client";

import React from 'react';
import { Button } from '@/components/uikit';

export default function AdminDashboardPage() {
  return (
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome to the minimal admin panel. Hook up stats and quick actions here.</p>

      <section style={{ display: 'grid', gap: 8 }}>
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="primary">Create Product</Button>
          <Button variant="secondary">Manage Categories</Button>
          <Button variant="ghost">View Orders</Button>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <h2>Status</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>DB connectivity: check via <code>/api/health</code></li>
          <li>Auth: to be implemented (JWT, middleware)</li>
          <li>Products/Categories/Orders: CRUD pages TBD</li>
        </ul>
      </section>
    </div>
  );
}
