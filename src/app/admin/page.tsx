import { auth } from "@/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Users, ShoppingCart, Hourglass, Ticket, CurrencyDollar } from "@phosphor-icons/react/dist/ssr";

interface Stats {
  count: number;
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  // Buscar estatísticas
  const [productCount] = await query<Stats>("SELECT COUNT(*) as count FROM products");
  const [userCount] = await query<Stats>("SELECT COUNT(*) as count FROM users");
  const [orderCount] = await query<Stats>("SELECT COUNT(*) as count FROM orders");
  const [pendingOrders] = await query<Stats>(
    "SELECT COUNT(*) as count FROM orders WHERE status = 'pendente'"
  );

  const stats = [
    { label: "Produtos", value: productCount.count, icon: <Package size={32} weight="duotone" className="text-zinc-300" />, href: "/admin/products" },
    { label: "Usuários", value: userCount.count, icon: <Users size={32} weight="duotone" className="text-zinc-300" />, href: "#" },
    { label: "Pedidos", value: orderCount.count, icon: <ShoppingCart size={32} weight="duotone" className="text-zinc-300" />, href: "/admin/orders" },
    { label: "Pendentes", value: pendingOrders.count, icon: <Hourglass size={32} weight="duotone" className="text-zinc-300" />, href: "/admin/orders" },
  ];

  return (
    <div className="min-h-[100dvh] pt-28 pb-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Painel Admin</h1>
        <p className="text-zinc-400 mb-12">Gerencie produtos, pedidos e usuários da loja Detroit.</p>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all group"
            >
              <span className="text-2xl mb-3 block">{stat.icon}</span>
              <p className="text-3xl font-bold text-white font-mono">{stat.value}</p>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <h2 className="text-2xl font-bold text-white mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/products"
            className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-[var(--color-detroit-red)]/50 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-detroit-red)]/10 flex items-center justify-center text-[var(--color-detroit-red)]">
              <Package size={24} weight="fill" />
            </div>
            <div>
              <p className="font-bold text-white">Gerenciar Produtos</p>
              <p className="text-sm text-zinc-500">Criar, editar e excluir produtos da loja</p>
            </div>
          </Link>
          <Link
            href="/admin/orders"
            className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-[var(--color-detroit-red)]/50 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-detroit-red)]/10 flex items-center justify-center text-[var(--color-detroit-red)]">
              <ShoppingCart size={24} weight="fill" />
            </div>
            <div>
              <p className="font-bold text-white">Gerenciar Pedidos</p>
              <p className="text-sm text-zinc-500">Ver e atualizar status dos pedidos</p>
            </div>
          </Link>
          <Link
            href="/admin/coupons"
            className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-[var(--color-detroit-red)]/50 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-detroit-red)]/10 flex items-center justify-center text-[var(--color-detroit-red)]">
              <Ticket size={24} weight="fill" />
            </div>
            <div>
              <p className="font-bold text-white">Gerenciar Cupons</p>
              <p className="text-sm text-zinc-500">Criar códigos de desconto</p>
            </div>
          </Link>
          <Link
            href="/admin/ids"
            className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-[#fcd34d]/50 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#fcd34d]/10 flex items-center justify-center text-[#fcd34d]">
              <Package size={24} weight="fill" />
            </div>
            <div>
              <p className="font-bold text-white">Gerenciar IDs in-Game</p>
              <p className="text-sm text-zinc-500">Controle de reservas e vendas</p>
            </div>
          </Link>
          <Link
            href="/admin/finance"
            className="p-6 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-[#10b981]/50 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
              <CurrencyDollar size={24} weight="fill" />
            </div>
            <div>
              <p className="font-bold text-white">Gerenciar Financeiro</p>
              <p className="text-sm text-zinc-500">Livro caixa, lucros e retiradas</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
