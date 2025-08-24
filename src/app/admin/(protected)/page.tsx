export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Панель керування</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>Товари</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>—</div>
        </div>
        <div
          style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>Замовлення</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>—</div>
        </div>
        <div
          style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}
        >
          <div style={{ fontSize: 12, color: "#6b7280" }}>Дохід</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>—</div>
        </div>
      </div>
    </div>
  );
}
