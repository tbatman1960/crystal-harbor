'use client'

import { useState } from 'react'
import {
  CpuChipIcon,
  GlobeAltIcon,
  ServerStackIcon,
  CircleStackIcon,
  CloudIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

type TabId = 'overview' | 'pages' | 'api' | 'database' | 'services' | 'flows' | 'security'

const tabs: { id: TabId; name: string; icon: typeof CpuChipIcon }[] = [
  { id: 'overview', name: 'Overview', icon: CpuChipIcon },
  { id: 'pages', name: 'Pages & Routes', icon: GlobeAltIcon },
  { id: 'api', name: 'API Routes', icon: ServerStackIcon },
  { id: 'database', name: 'Database', icon: CircleStackIcon },
  { id: 'services', name: 'External Services', icon: CloudIcon },
  { id: 'flows', name: 'Data Flows', icon: ArrowPathIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
]

// Reusable components
function Card({ title, icon, children, className = '', danger = false }: {
  title: string; icon?: string; children: React.ReactNode; className?: string; danger?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${danger ? 'border-red-200' : 'border-gray-100'} p-6 ${className}`}>
      <h3 className={`text-lg font-semibold ${danger ? 'text-red-600' : 'text-gray-800'} mb-4 flex items-center gap-2`}>
        {icon && <span className="text-xl">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

function Tag({ color, children }: { color: 'green' | 'yellow' | 'red' | 'blue' | 'orange'; children: React.ReactNode }) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
  }
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>
}

function LiveDot() {
  return <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-100 text-orange-600 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
}

function FlowStep({ title, detail, highlight = false }: { title: string; detail: string; highlight?: boolean }) {
  return (
    <div className={`min-w-[130px] p-4 rounded-lg border-2 text-center flex-shrink-0 ${highlight ? 'border-green-400 bg-green-50' : 'border-primary-200 bg-primary-50'}`}>
      <div className="font-semibold text-sm text-gray-800">{title}</div>
      <div className="text-[11px] text-gray-500 mt-1 whitespace-pre-line">{detail}</div>
    </div>
  )
}

function FlowArrow() {
  return <div className="text-2xl text-primary-400 flex-shrink-0 px-1">→</div>
}

function ServiceBox({ icon, name, role, detail, borderColor = 'border-gray-200' }: {
  icon: string; name: string; role: string; detail: string; borderColor?: string
}) {
  return (
    <div className={`bg-gray-50 border ${borderColor} rounded-lg p-4 text-center hover:shadow-md transition-shadow`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-semibold text-gray-800 text-sm">{name}</div>
      <div className="text-[11px] text-gray-500 mt-1">{role}</div>
      <div className="text-[11px] text-orange-600 mt-2">{detail}</div>
    </div>
  )
}

function SchemaTable({ name, fields }: { name: string; fields: { name: string; type: string; pk?: boolean; fk?: boolean }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-primary-600 text-white px-4 py-2.5 font-semibold text-sm">{name}</div>
      <div className="py-2">
        {fields.map((f, i) => (
          <div key={i} className="px-4 py-1 text-xs flex justify-between">
            <span className={f.pk ? 'text-yellow-600 font-semibold' : f.fk ? 'text-orange-600' : 'text-gray-700'}>
              {f.pk ? '🔑 ' : f.fk ? '↗ ' : ''}{f.name}
            </span>
            <span className="text-gray-400">{f.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SecurityItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <div className="font-semibold text-gray-800 text-sm">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{desc}</div>
      </div>
    </div>
  )
}

// Tab content components
function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Stack" icon="⚡">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-2 text-gray-500 w-28">Framework</td><td><Code>Next.js 14</Code> App Router + TypeScript</td></tr>
              <tr><td className="py-2 text-gray-500">Frontend</td><td>React 18, Tailwind CSS 3, Zustand, Heroicons</td></tr>
              <tr><td className="py-2 text-gray-500">Database</td><td>Supabase (PostgreSQL) — 20+ tables</td></tr>
              <tr><td className="py-2 text-gray-500">Payments</td><td><LiveDot />Stripe (LIVE keys)</td></tr>
              <tr><td className="py-2 text-gray-500">Email</td><td>Nodemailer → Namecheap SMTP</td></tr>
              <tr><td className="py-2 text-gray-500">Shipping</td><td>USPS REST API (OAuth2)</td></tr>
              <tr><td className="py-2 text-gray-500">Canvas</td><td>Fabric.js v6 (customization editor)</td></tr>
              <tr><td className="py-2 text-gray-500">Hosting</td><td><LiveDot />Netlify Pro (auto-deploy)</td></tr>
              <tr><td className="py-2 text-gray-500">Analytics</td><td><Tag color="red">placeholder</Tag> GA4</td></tr>
            </tbody>
          </table>
        </Card>
        <Card title="Current Status" icon="📊">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-2 text-gray-500 w-32">Products</td><td>4 products across 4 categories</td></tr>
              <tr><td className="py-2 text-gray-500">Admin Sections</td><td>15 pages (full CRUD)</td></tr>
              <tr><td className="py-2 text-gray-500">API Routes</td><td>35+ endpoints</td></tr>
              <tr><td className="py-2 text-gray-500">Source Files</td><td>199 files, ~42K lines</td></tr>
            </tbody>
          </table>
          <div className="flex flex-wrap gap-2 mt-4">
            <Tag color="green">Payments Live</Tag>
            <Tag color="green">Email Working</Tag>
            <Tag color="green">USPS Rates Live</Tag>
            <Tag color="yellow">Labels Mock</Tag>
            <Tag color="red">GA4 Placeholder</Tag>
            <Tag color="red">No Custom Domain</Tag>
          </div>
        </Card>
      </div>

      <Card title="High-Level Architecture" icon="🏗️">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <ServiceBox icon="🌐" name="Netlify CDN" role="Hosting + SSL + Deploy" detail="Auto-deploy from GitHub" borderColor="border-orange-200" />
          <ServiceBox icon="⚛️" name="Next.js 14" role="Unified Frontend + Backend" detail="App Router + API Routes" borderColor="border-primary-200" />
          <ServiceBox icon="🗄️" name="Supabase" role="PostgreSQL + Storage" detail="RLS enabled, service role" borderColor="border-green-200" />
          <ServiceBox icon="💳" name="Stripe" role="Payments + Refunds" detail="LIVE keys active" borderColor="border-purple-200" />
          <ServiceBox icon="📧" name="Namecheap SMTP" role="All Outgoing Email" detail="info@crystalharbortc.com" borderColor="border-blue-200" />
          <ServiceBox icon="📦" name="USPS API" role="Rates + Labels + Tracking" detail="OAuth2 REST, 3 services" borderColor="border-yellow-200" />
        </div>
      </Card>

      <Card title="Directory Structure" icon="📁">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-semibold text-primary-600 mb-2">src/app/</div>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>→ Page routes (SSR/Static)</li>
              <li>→ <Code>/admin/*</Code> — 15 admin pages</li>
              <li>→ <Code>/api/*</Code> — 35+ API routes</li>
              <li>→ <Code>layout.tsx</Code> — Root layout</li>
              <li>→ <Code>globals.css</Code> — Global styles</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-primary-600 mb-2">src/components/</div>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>→ <Code>layout/</Code> — Header, Footer</li>
              <li>→ <Code>auth/</Code> — Login, Register forms</li>
              <li>→ <Code>checkout/</Code> — Checkout, Stripe, Summary</li>
              <li>→ <Code>products/</Code> — Card, Detail, Pricing</li>
              <li>→ <Code>mobile/</Code> — Touch, Payment methods</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-primary-600 mb-2">src/lib/ & src/store/</div>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>→ <Code>supabase.ts</Code> — Dual client (anon + admin)</li>
              <li>→ <Code>orders.ts, auth.ts, email.ts</Code></li>
              <li>→ <Code>carriers/usps.ts</Code> — USPS integration</li>
              <li>→ <Code>packing.ts</Code> — Box algorithm</li>
              <li>→ Zustand stores: cart, auth, admin</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

function PagesTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Public Pages" icon="🛍️">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left pb-2 text-gray-500 font-medium text-xs">Route</th><th className="text-left pb-2 text-gray-500 font-medium text-xs">Purpose</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['/', 'Homepage — hero, categories, features, how-it-works'],
                  ['/products', 'Product catalog'],
                  ['/products/[cat]/[slug]', 'Product detail — gallery, options, design, cart'],
                  ['/cart', 'Shopping cart (Zustand + localStorage)'],
                  ['/checkout', 'Shipping → Payment → Success'],
                  ['/account', 'Customer profile, orders, reorder'],
                  ['/auth/login', 'Login (detects admin emails)'],
                  ['/auth/register', 'Registration'],
                  ['/auth/forgot-password', 'Password reset request'],
                  ['/auth/reset-password', 'Reset with token'],
                  ['/orders', 'Order lookup by number'],
                  ['/contact', 'Contact form (sends email)'],
                  ['/about', 'About page'],
                  ['/terms', 'Terms of service'],
                  ['/privacy', 'Privacy policy'],
                  ['/returns', 'Return policy'],
                  ['/refunds', 'Refund policy'],
                  ['/offline', 'PWA offline fallback'],
                ].map(([route, purpose]) => (
                  <tr key={route}><td className="py-2"><Code>{route}</Code></td><td className="py-2 text-gray-600 text-xs">{purpose}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Admin Portal /admin/*" icon="🔧">
          <p className="text-xs text-gray-500 mb-3">Own layout, sidebar nav, separate auth. Hidden from public site.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th className="text-left pb-2 text-gray-500 font-medium text-xs">Route</th><th className="text-left pb-2 text-gray-500 font-medium text-xs">Purpose</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['/admin', 'Dashboard — stats, recent orders'],
                  ['/admin/orders', 'Order management + status updates'],
                  ['/admin/customers', 'Customer CRUD + password reset'],
                  ['/admin/products', 'Product CRUD (add / edit / delete)'],
                  ['/admin/subscribers', 'Email subscriber management'],
                  ['/admin/newsletter', 'Compose + send + history'],
                  ['/admin/shipping', 'Package types, settings, test calc'],
                  ['/admin/reports', 'Sales reports'],
                  ['/admin/analytics', 'Analytics dashboard'],
                  ['/admin/seo', 'SEO settings'],
                  ['/admin/policies', 'Store policies editor'],
                  ['/admin/refund-policies', 'Refund rules config'],
                  ['/admin/export', 'CSV data export'],
                  ['/admin/settings', 'Site settings'],
                  ['/admin/email-test', 'Email testing tool'],
                  ['/admin/customization/[id]', 'Product template/text/pricing'],
                  ['/admin/design-catalog', 'Design catalog management'],
                  ['/admin/architecture', 'Architecture map (this page)'],
                ].map(([route, purpose]) => (
                  <tr key={route}><td className="py-2"><Code>{route}</Code></td><td className="py-2 text-gray-600 text-xs">{purpose}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Card title="Customization Module" icon="🎨">
        <p className="text-xs text-gray-500 mb-3"><Code>src/modules/customization/</Code></p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold text-orange-600 text-xs mb-1">Canvas Editor</div>
            <div className="text-xs text-gray-600">Fabric.js v6, layer panel, undo/redo, text toolbar, image upload, low-res warnings</div>
          </div>
          <div>
            <div className="font-semibold text-orange-600 text-xs mb-1">AI Services</div>
            <div className="text-xs text-gray-600">Image generation, upscaling, style transfer, realistic preview. Mock + OpenAI implementations.</div>
          </div>
          <div>
            <div className="font-semibold text-orange-600 text-xs mb-1">Templates & Sharing</div>
            <div className="text-xs text-gray-600">5 built-in templates, social sharing with public page + feedback, save/resume designs</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ApiTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">All API routes use <Code>supabaseAdmin</Code> (service role key). Client components call these via <Code>fetch()</Code> — never query Supabase directly.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Authentication" icon="🔐">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left pb-2 text-xs text-gray-500 w-16">Method</th><th className="text-left pb-2 text-xs text-gray-500">Route</th><th className="text-left pb-2 text-xs text-gray-500">Purpose</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['POST', '/api/auth/login', 'Customer login'],
                ['POST', '/api/auth/register', 'Registration'],
                ['POST', '/api/auth/check-admin', 'Admin email detection'],
                ['POST', '/api/auth/forgot-password', 'Password reset email'],
                ['POST', '/api/auth/reset-password', 'Token verify + update'],
                ['POST', '/api/admin/auth/login', 'Admin login'],
              ].map(([m, r, p]) => (
                <tr key={r}><td className="py-1.5"><Tag color="blue">{m}</Tag></td><td className="py-1.5"><Code>{r}</Code></td><td className="py-1.5 text-xs text-gray-600">{p}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Orders & Payments" icon="💰">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left pb-2 text-xs text-gray-500 w-16">Method</th><th className="text-left pb-2 text-xs text-gray-500">Route</th><th className="text-left pb-2 text-xs text-gray-500">Purpose</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['POST', '/api/create-payment-intent', 'Stripe PaymentIntent'],
                ['POST', '/api/webhooks/stripe', 'Webhook verification'],
                ['GET', '/api/orders/[num]', 'Order lookup'],
                ['POST', '/api/orders/cancel', 'Customer cancellation'],
                ['POST', '/api/calculate-tax', 'Sales tax (7% IN)'],
                ['POST', '/api/refunds/process', 'Admin refund'],
              ].map(([m, r, p]) => (
                <tr key={r}><td className="py-1.5"><Tag color={m === 'GET' ? 'green' : 'blue'}>{m}</Tag></td><td className="py-1.5"><Code>{r}</Code></td><td className="py-1.5 text-xs text-gray-600">{p}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Email & Newsletter" icon="📧">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left pb-2 text-xs text-gray-500 w-16">Method</th><th className="text-left pb-2 text-xs text-gray-500">Route</th><th className="text-left pb-2 text-xs text-gray-500">Purpose</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['POST', '/api/send-email', 'Dispatch by type'],
                ['POST', '/api/subscribe-email', 'Newsletter signup'],
                ['POST', '/api/test-email', 'Email testing'],
                ['POST', '/api/admin/newsletter/send', 'Mass newsletter'],
                ['GET', '/api/admin/newsletter/history', 'Send history'],
                ['POST', '/api/admin/daily-reminder', 'Daily summary'],
              ].map(([m, r, p]) => (
                <tr key={r}><td className="py-1.5"><Tag color={m === 'GET' ? 'green' : 'blue'}>{m}</Tag></td><td className="py-1.5"><Code>{r}</Code></td><td className="py-1.5 text-xs text-gray-600">{p}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Products & Admin" icon="📦">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left pb-2 text-xs text-gray-500 w-16">Method</th><th className="text-left pb-2 text-xs text-gray-500">Route</th><th className="text-left pb-2 text-xs text-gray-500">Purpose</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['GET', '/api/products', 'Public product list'],
                ['GET', '/api/admin/dashboard', 'Dashboard stats'],
                ['CRUD', '/api/admin/products/*', 'Product management'],
                ['CRUD', '/api/admin/orders', 'Order management'],
                ['CRUD', '/api/admin/customers', 'Customer management'],
                ['GET', '/api/admin/reports', 'Sales reports'],
                ['GET', '/api/admin/analytics-reports', 'Analytics data'],
                ['POST', '/api/admin/export-data', 'CSV export'],
                ['GET/PUT', '/api/admin/site-settings', 'Site settings'],
                ['GET/PUT', '/api/admin/refund-policies', 'Refund policies'],
              ].map(([m, r, p]) => (
                <tr key={r}><td className="py-1.5"><Tag color={m === 'GET' ? 'green' : m.includes('CRUD') ? 'orange' : 'blue'}>{m}</Tag></td><td className="py-1.5"><Code>{r}</Code></td><td className="py-1.5 text-xs text-gray-600">{p}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

function DatabaseTab() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Supabase PostgreSQL — RLS enabled on all tables with no policies. Service role key bypasses RLS. <span className="text-yellow-600">Gold = primary key</span> · <span className="text-orange-600">Orange = foreign key</span></p>

      <Card title="Core Tables" icon="🏪">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SchemaTable name="customers" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'email', type: 'text (unique)' },
            { name: 'password_hash', type: 'text' },
            { name: 'first_name, last_name', type: 'text' },
            { name: 'phone', type: 'text' },
            { name: 'address fields', type: 'text' },
            { name: 'active', type: 'boolean' },
          ]} />
          <SchemaTable name="products" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'category_id', type: '→ categories', fk: true },
            { name: 'name, slug', type: 'text' },
            { name: 'base_price', type: 'numeric' },
            { name: 'size_class', type: "default 'small'" },
            { name: 'packing_units', type: 'default 1.0' },
            { name: 'packed_weight_lbs', type: 'default 0.5' },
            { name: 'is_customizable', type: 'boolean' },
          ]} />
          <SchemaTable name="orders" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'order_number', type: 'CH-YYYY-NNN' },
            { name: 'customer_id', type: '→ customers (nullable)', fk: true },
            { name: 'guest_email', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'subtotal, shipping_cost, total', type: 'numeric' },
            { name: 'stripe_payment_intent_id', type: 'text' },
            { name: 'shipping_address', type: 'JSONB' },
          ]} />
        </div>
      </Card>

      <Card title="Related Tables" icon="🔗">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SchemaTable name="categories" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'name, slug', type: 'text' },
            { name: 'display_order', type: 'int' },
          ]} />
          <SchemaTable name="order_items" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'order_id', type: '→ orders', fk: true },
            { name: 'product_name', type: 'text' },
            { name: 'quantity, unit_price, line_total', type: 'numeric' },
            { name: 'customization_data', type: 'JSONB' },
            { name: 'customization_fee', type: 'numeric' },
          ]} />
          <SchemaTable name="product_options" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'product_id', type: '→ products', fk: true },
            { name: 'option_type', type: "'size'|'color'|custom" },
            { name: 'option_value', type: 'text' },
            { name: 'price_adjustment', type: 'numeric' },
          ]} />
          <SchemaTable name="pricing_tiers" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'product_id', type: '→ products', fk: true },
            { name: 'min_quantity, max_quantity', type: 'int' },
            { name: 'price_per_unit', type: 'numeric' },
          ]} />
          <SchemaTable name="shipping_packages" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'name', type: 'text' },
            { name: 'capacity_units, max_weight_lbs', type: 'numeric' },
            { name: 'length/width/height_inches', type: 'numeric' },
            { name: 'fallback_rate', type: 'numeric' },
          ]} />
          <SchemaTable name="shipping_labels" fields={[
            { name: 'id', type: 'uuid', pk: true },
            { name: 'order_id', type: '→ orders', fk: true },
            { name: 'tracking_number', type: 'text' },
            { name: 'label_data', type: 'base64 PDF' },
            { name: 'cost, status', type: 'numeric/text' },
          ]} />
        </div>
      </Card>

      <Card title="Customization Tables" icon="🎨">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SchemaTable name="product_templates" fields={[
            { name: 'product_id, color_name', type: 'FK + text' },
            { name: 'printable_area_x/y/w/h', type: 'numeric' },
            { name: 'physical_w/h_inches', type: 'numeric' },
          ]} />
          <SchemaTable name="saved_designs" fields={[
            { name: 'user_id, product_id', type: 'FKs' },
            { name: 'design_data', type: 'JSONB' },
            { name: 'name, thumbnail_url', type: 'text' },
          ]} />
          <SchemaTable name="design_templates" fields={[
            { name: 'name, category, description', type: 'text' },
            { name: 'layer_data', type: 'JSONB' },
            { name: 'product_types', type: 'text[]' },
          ]} />
        </div>
      </Card>

      <Card title="Supporting Tables" icon="📋">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="text-left pb-2 text-xs text-gray-500">Table</th><th className="text-left pb-2 text-xs text-gray-500">Purpose</th><th className="text-left pb-2 text-xs text-gray-500">Key Fields</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['admin_users', 'Admin accounts (separate from customers)', 'email, password_hash, role'],
                ['subscriber_emails', 'Newsletter subscribers', 'email, source, discount_code'],
                ['discount_codes', 'Discount codes', 'code, type, value, usage_limit'],
                ['newsletter_sends', 'Newsletter send history', 'subject, recipient_count, status'],
                ['password_reset_tokens', 'Password reset (1hr expiry)', 'token, customer_id, expires_at'],
                ['refund_policies', 'Refund rules by order status', 'status, refund_percentage, conditions'],
                ['refund_requests', 'Refund tracking', 'order_id, amount, stripe_refund_id'],
                ['shared_designs', 'Shareable design links', 'design_data, share_token, click_count'],
                ['site_settings', 'Key-value site config', 'key, value, category'],
              ].map(([t, p, f]) => (
                <tr key={t}><td className="py-2"><Code>{t}</Code></td><td className="py-2 text-xs text-gray-600">{p}</td><td className="py-2 text-xs text-gray-500">{f}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function ServicesTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Supabase" icon="🗄️">
        <Tag color="green">Live</Tag>
        <table className="w-full text-sm mt-3">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 text-gray-500 w-20">Type</td><td>PostgreSQL + Storage + REST API</td></tr>
            <tr><td className="py-2 text-gray-500">Tables</td><td>20+ tables with RLS enabled</td></tr>
            <tr><td className="py-2 text-gray-500">Access</td><td>Dual client — anon (blocked) + service role (bypasses)</td></tr>
            <tr><td className="py-2 text-gray-500">Storage</td><td>Print-ready files, design uploads</td></tr>
            <tr><td className="py-2 text-gray-500">Key file</td><td><Code>src/lib/supabase.ts</Code></td></tr>
          </tbody>
        </table>
      </Card>
      <Card title="Stripe" icon="💳">
        <Tag color="green">LIVE</Tag>
        <table className="w-full text-sm mt-3">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 text-gray-500 w-20">Mode</td><td><LiveDot />Live keys active</td></tr>
            <tr><td className="py-2 text-gray-500">Features</td><td>PaymentIntent, Refunds, Webhooks</td></tr>
            <tr><td className="py-2 text-gray-500">Webhook</td><td><Code>/api/webhooks/stripe</Code> — signature verified</td></tr>
            <tr><td className="py-2 text-gray-500">Events</td><td>payment_intent.succeeded, .failed, charge.refunded</td></tr>
          </tbody>
        </table>
      </Card>
      <Card title="Email (SMTP)" icon="📧">
        <Tag color="green">Live</Tag>
        <table className="w-full text-sm mt-3">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 text-gray-500 w-20">Provider</td><td>Namecheap PrivateEmail</td></tr>
            <tr><td className="py-2 text-gray-500">Host</td><td><Code>mail.privateemail.com:587</Code></td></tr>
            <tr><td className="py-2 text-gray-500">Sender</td><td><Code>info@crystalharbortc.com</Code> (single sender)</td></tr>
            <tr><td className="py-2 text-gray-500">Behavior</td><td>Fire & forget, 5s timeout, IPv4 forced</td></tr>
            <tr><td className="py-2 text-gray-500">Templates</td><td>Confirmation, status, welcome, vendor, newsletter, password reset</td></tr>
          </tbody>
        </table>
      </Card>
      <Card title="USPS API" icon="📦">
        <Tag color="yellow">Rates Live / Labels Mock</Tag>
        <table className="w-full text-sm mt-3">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 text-gray-500 w-20">Auth</td><td>OAuth2 client credentials → payment auth token</td></tr>
            <tr><td className="py-2 text-gray-500">Rates</td><td><LiveDot />Domestic Prices v3 (3 service levels)</td></tr>
            <tr><td className="py-2 text-gray-500">Labels</td><td><Tag color="blue">Mock</Tag> until <Code>USPS_ENV=production</Code></td></tr>
            <tr><td className="py-2 text-gray-500">Account</td><td>MC2 Consulting LLC, EPS: 1000420021</td></tr>
            <tr><td className="py-2 text-gray-500">Fallback</td><td>Utilization-based flat rates when API unavailable</td></tr>
          </tbody>
        </table>
      </Card>
      <Card title="Netlify" icon="🌐">
        <Tag color="green">Live</Tag>
        <table className="w-full text-sm mt-3">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 text-gray-500 w-20">Plan</td><td>Pro</td></tr>
            <tr><td className="py-2 text-gray-500">URL</td><td><Code>crystal-harbor.netlify.app</Code></td></tr>
            <tr><td className="py-2 text-gray-500">Deploy</td><td>Auto-deploy on push to <Code>main</Code></td></tr>
            <tr><td className="py-2 text-gray-500">Headers</td><td>Security headers in <Code>netlify.toml</Code></td></tr>
          </tbody>
        </table>
      </Card>
      <Card title="Google Analytics" icon="📊">
        <Tag color="red">Placeholder</Tag>
        <table className="w-full text-sm mt-3">
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 text-gray-500 w-20">Status</td><td>GA4 code integrated, ID is <Code>G-XXXXXXXXXX</Code></td></tr>
            <tr><td className="py-2 text-gray-500">Events</td><td>Page views, add to cart, begin checkout, purchase</td></tr>
            <tr><td className="py-2 text-gray-500">Needed</td><td>Real GA4 measurement ID from Tim</td></tr>
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function FlowsTab() {
  return (
    <div className="space-y-6">
      <Card title="Order Lifecycle" icon="🛒">
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          <FlowStep title="Browse" detail={"Product catalog\nCategories"} />
          <FlowArrow />
          <FlowStep title="Customize" detail={"Fabric.js editor\nAI tools"} />
          <FlowArrow />
          <FlowStep title="Add to Cart" detail={"Zustand store\nlocalStorage"} />
          <FlowArrow />
          <FlowStep title="Checkout" detail={"Shipping address\nTax calc (7% IN)"} />
          <FlowArrow />
          <FlowStep title="Payment" detail={"Stripe Elements\nPaymentIntent"} />
          <FlowArrow />
          <FlowStep title="Order Created" detail={"Supabase insert\nCH-YYYY-NNN"} highlight />
          <FlowArrow />
          <FlowStep title="Email Sent" detail={"Confirmation\nFire & forget"} />
          <FlowArrow />
          <FlowStep title="Print Files" detail={"300 DPI export\nSupabase Storage"} />
        </div>
        <div className="flex items-center gap-0 overflow-x-auto pb-2 mt-4">
          <FlowStep title="Webhook" detail={"Stripe verifies\nserver-side backup"} />
          <FlowArrow />
          <FlowStep title="Admin Manages" detail={"Status updates\nVendor forwarding"} />
          <FlowArrow />
          <FlowStep title="Ship Labels" detail={"USPS API\n4×6\" PDF labels"} />
          <FlowArrow />
          <FlowStep title="Status Email" detail={"Tracking number\nCustomer notified"} />
          <FlowArrow />
          <FlowStep title="Delivered ✓" detail={"USPS tracking\nOrder complete"} highlight />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Authentication Flow" icon="🔐">
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            <FlowStep title="Login Form" detail={"Email + password\nAdmin detect on blur"} />
            <FlowArrow />
            <FlowStep title="API Validates" detail={"bcrypt compare\nCase-insensitive"} />
            <FlowArrow />
            <FlowStep title="Zustand Store" detail={"User object saved\n→ localStorage"} />
          </div>
          <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-600">
            ⚠️ No JWTs, no server sessions. Auth is purely client-side localStorage. Anyone with a valid user ID can access protected pages.
          </div>
        </Card>
        <Card title="Shipping Calculation" icon="📦">
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            <FlowStep title="Cart Items" detail={"packing_units\npacked_weight_lbs"} />
            <FlowArrow />
            <FlowStep title="Packing Algo" detail={"Optimal boxes\nby units + weight"} />
            <FlowArrow />
            <FlowStep title="USPS Rates" detail={"3 service levels\nGround/Priority/Express"} />
          </div>
          <p className="text-[11px] text-gray-500 text-center mt-2">Falls back to utilization-based flat rates when USPS API unavailable</p>
        </Card>
      </div>

      <Card title="Email Types" icon="📧">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['📬', 'Order Confirmation', 'On successful payment', 'border-green-200'],
            ['🔄', 'Status Update', 'Admin changes status', 'border-blue-200'],
            ['❌', 'Cancellation', 'Customer or admin cancel', 'border-red-200'],
            ['👋', 'Welcome', 'New registration', 'border-yellow-200'],
            ['🏭', 'Vendor Forward', 'Order details to vendor', 'border-orange-200'],
            ['🔑', 'Password Reset', 'Token link (1hr expiry)', 'border-purple-200'],
            ['📰', 'Newsletter', 'Mass send to subscribers', 'border-pink-200'],
            ['📋', 'Daily Reminder', 'Admin summary (cron)', 'border-gray-300'],
          ].map(([icon, name, role, border]) => (
            <div key={name} className={`bg-gray-50 border ${border} rounded-lg p-3 text-center`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className="font-semibold text-xs text-gray-800">{name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{role}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card title="Security Model" icon="🛡️">
        <SecurityItem icon="🗄️" title="Row Level Security (RLS)" desc="Enabled on ALL tables with NO policies. Anon key (exposed in frontend) is completely blocked. Service role key (API routes only) bypasses RLS. Client components must use fetch() to API routes — never query Supabase directly." />
        <SecurityItem icon="💳" title="Stripe Webhook Verification" desc="All webhook events verified via signing secret (whsec_*). Handles payment_intent.succeeded, payment_intent.payment_failed, and charge.refunded events server-side." />
        <SecurityItem icon="🔒" title="Admin Portal Hidden" desc="No public links to admin. Header, footer, and popups hidden on /admin/* routes. Admin detection only via email blur on customer login form." />
        <SecurityItem icon="📦" title="USPS Labels Guarded" desc="USPS_ENV=production required for real label creation. Mock labels generated otherwise. Auto-void on cancellation reclaims postage." />
        <SecurityItem icon="🖼️" title="Print Files Protected" desc="Server validates payment_intent_id exists before accepting print file uploads. Customers never get access to production files." />
        <SecurityItem icon="🔑" title="Password Handling" desc="All passwords bcrypt-hashed. Password reset via secure token with 1-hour expiry. Case-insensitive email matching via ilike." />
      </Card>
      <Card title="Known Security Gaps" icon="⚠️" danger>
        <SecurityItem icon="🚫" title="No Server-Side Auth Validation" desc="Auth is purely client-side localStorage. No JWTs, no session tokens. Anyone with a valid user ID in localStorage can access protected pages. API routes don't validate caller identity." />
        <SecurityItem icon="🚫" title="No Rate Limiting" desc="API routes have no rate limiting or abuse prevention. Login, registration, and email endpoints are vulnerable to brute force." />
        <SecurityItem icon="🚫" title="No Email Verification" desc="Customer registration doesn't verify email addresses. Anyone can register with any email." />
      </Card>
    </div>
  )
}

export default function ArchitecturePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Architecture Map</h1>
        <p className="text-sm text-gray-500 mt-1">DearPast e-commerce platform — Next.js 14 + Supabase + Stripe</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'pages' && <PagesTab />}
      {activeTab === 'api' && <ApiTab />}
      {activeTab === 'database' && <DatabaseTab />}
      {activeTab === 'services' && <ServicesTab />}
      {activeTab === 'flows' && <FlowsTab />}
      {activeTab === 'security' && <SecurityTab />}
    </div>
  )
}
