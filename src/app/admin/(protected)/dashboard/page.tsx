"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useSWR from "swr";
import { AdminApi } from "@/services/admin";
import type { Product } from "@/types/catalog";
import styles from "./dashboard.module.scss";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface StatsData {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
  productsInStock: number;
  productsOutOfStock: number;
  newOrders: number;
  completedOrders: number;
  avgOrderValue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0,
    productsInStock: 0,
    productsOutOfStock: 0,
    newOrders: 0,
    completedOrders: 0,
    avgOrderValue: 0,
  });

  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  const { data: products } = useSWR(["admin/products"], () =>
    AdminApi.listProducts({ page: 1, perPage: 1000 }),
  );

  const { data: categories } = useSWR(["admin/categories"], () =>
    AdminApi.listCategories(),
  );

  const { data: orders } = useSWR(["admin/orders"], () =>
    AdminApi.listOrders({ page: 1, perPage: 1000 }),
  );

  useEffect(() => {
    if (products && categories && orders) {
      const productsInStock = products.items.filter(
        (p: Product) => p.stock > 0,
      ).length;
      const totalRevenue = orders.items.reduce((sum: number, order: any) => {
        return sum + (order.totals?.grand || 0);
      }, 0);
      const newOrders = orders.items.filter(
        (o: any) => o.status === "new",
      ).length;
      const completedOrders = orders.items.filter(
        (o: any) => o.status === "completed",
      ).length;
      const avgOrderValue = orders.items?.length
        ? totalRevenue / orders.items.length
        : 0;

      setStats({
        totalProducts: products.total,
        totalCategories: categories?.length ?? 0,
        totalOrders: orders.total,
        totalRevenue,
        productsInStock,
        productsOutOfStock: products.total - productsInStock,
        newOrders,
        completedOrders,
        avgOrderValue,
      });

      // Products per category
      const categoryMap = new Map();
      products.items?.forEach((product: any) => {
        const catId = product.categoryId;
        const category = categories?.find((c: any) => c.id === catId);
        const catName = category?.name || "Без категорії";
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1);
      });
      setCategoryData(
        Array.from(categoryMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
      );

      // Stock data
      setStockData([
        { name: "В наявності", value: productsInStock },
        { name: "Відсутні", value: products.total - productsInStock },
      ]);

      // Order status data
      const statusMap: any = {};
      orders.items?.forEach((order: any) => {
        statusMap[order.status] = (statusMap[order.status] || 0) + 1;
      });
      setOrderStatusData(
        Object.entries(statusMap).map(([name, value]) => ({
          name:
            name === "new" ? "Нові" : name === "completed" ? "Виконані" : name,
          value,
        })),
      );

      // Revenue over time
      const monthlyRevenue: any = {};
      orders.items?.forEach((order: any) => {
        const date = new Date(order.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyRevenue[monthKey] =
          (monthlyRevenue[monthKey] || 0) + (order.totals?.grand || 0);
      });
      setRevenueData(
        Object.entries(monthlyRevenue)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month))
          .slice(-6),
      );
    }
  }, [products, categories, orders]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Панель керування</h1>
      </div>

      {/* Statistics Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalProducts}</div>
            <div className={styles.statLabel}>Всього товарів</div>
          </div>
          <Link href="/admin/products" className={styles.statLink}>
            Переглянути →
          </Link>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📂</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalCategories}</div>
            <div className={styles.statLabel}>Категорій</div>
          </div>
          <Link href="/admin/categories" className={styles.statLink}>
            Переглянути →
          </Link>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🛒</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.totalOrders}</div>
            <div className={styles.statLabel}>Замовлень</div>
          </div>
          <Link href="/admin/orders" className={styles.statLink}>
            Переглянути →
          </Link>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {stats.totalRevenue.toFixed(0)} ₴
            </div>
            <div className={styles.statLabel}>Загальний дохід</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.productsInStock}</div>
            <div className={styles.statLabel}>Товарів в наявності</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.productsOutOfStock}</div>
            <div className={styles.statLabel}>Товарів немає в наявності</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🆕</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.newOrders}</div>
            <div className={styles.statLabel}>Нових замовлень</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✔️</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.completedOrders}</div>
            <div className={styles.statLabel}>Виконаних замовлень</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>💵</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {stats.avgOrderValue.toFixed(0)} ₴
            </div>
            <div className={styles.statLabel}>Середній чек</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Товари по категоріях</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stock Status */}
        {stockData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Статус товарів</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Order Status */}
        {orderStatusData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Статус замовлень</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Revenue over time */}
        {revenueData.length > 0 && (
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Дохід за місяцями</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  name="Дохід (₴)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Швидкі дії</h2>
        <div className={styles.actionsGrid}>
          <Link href="/admin/products/new" className={styles.actionCard}>
            <span className={styles.actionIcon}>➕</span>
            <span className={styles.actionLabel}>Додати товар</span>
          </Link>
          <Link href="/admin/categories/new" className={styles.actionCard}>
            <span className={styles.actionIcon}>📁</span>
            <span className={styles.actionLabel}>Додати категорію</span>
          </Link>
          <Link href="/admin/orders" className={styles.actionCard}>
            <span className={styles.actionIcon}>📋</span>
            <span className={styles.actionLabel}>Переглянути замовлення</span>
          </Link>
          <Link href="/admin/settings" className={styles.actionCard}>
            <span className={styles.actionIcon}>⚙️</span>
            <span className={styles.actionLabel}>Налаштування</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
