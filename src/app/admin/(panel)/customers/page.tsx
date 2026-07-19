import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

export default async function AdminCustomersPage() {
  const customers = await db.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      orders: { select: { grandTotal: true, status: true } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <>
      <div className="admin-header">
        <h1>Customers</h1>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Orders</th>
            <th>Lifetime Value</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const lifetime = customer.orders
              .filter((o) => !["pending", "payment_pending", "cancelled"].includes(o.status))
              .reduce((sum, o) => sum + Number(o.grandTotal), 0);
            return (
              <tr key={customer.id}>
                <td>{customer.name ?? "—"}</td>
                <td>{customer.phone ?? "—"}</td>
                <td>{customer.email ?? "—"}</td>
                <td>{customer._count.orders}</td>
                <td>{formatINR(lifetime)}</td>
                <td>{customer.createdAt.toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
              </tr>
            );
          })}
          {!customers.length ? (
            <tr>
              <td colSpan={6} style={{ color: "var(--muted)" }}>
                No customers yet.
              </td>
            </tr>
          ) : null}
        </tbody>
        </table>
      </div>
    </>
  );
}
