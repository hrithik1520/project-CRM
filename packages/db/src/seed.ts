import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Users ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  const agentPassword = await bcrypt.hash('agent123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {},
    create: {
      email: 'admin@crm.local',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'admin',
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@crm.local' },
    update: {},
    create: {
      email: 'manager@crm.local',
      name: 'Sales Manager',
      passwordHash: agentPassword,
      role: 'manager',
    },
  })

  const agent1 = await prisma.user.upsert({
    where: { email: 'ravi@crm.local' },
    update: {},
    create: {
      email: 'ravi@crm.local',
      name: 'Ravi Kumar',
      passwordHash: agentPassword,
      role: 'agent',
    },
  })

  const agent2 = await prisma.user.upsert({
    where: { email: 'priya@crm.local' },
    update: {},
    create: {
      email: 'priya@crm.local',
      name: 'Priya Sharma',
      passwordHash: agentPassword,
      role: 'agent',
    },
  })

  console.log('✅ Users created')

  // ── Pipelines & Stages ─────────────────────────────────
  const salesPipeline = await prisma.pipeline.upsert({
    where: { id: 'pipeline-sales-001' },
    update: {},
    create: {
      id: 'pipeline-sales-001',
      name: 'Sales Pipeline',
      isDefault: true,
      position: 0,
      createdById: admin.id,
    },
  })

  const stageData = [
    { id: 'stage-new', name: 'New Lead', position: 0, color: '#6B7280' },
    { id: 'stage-contacted', name: 'Contacted', position: 1, color: '#3B82F6' },
    { id: 'stage-qualified', name: 'Qualified', position: 2, color: '#8B5CF6' },
    { id: 'stage-proposal', name: 'Proposal Sent', position: 3, color: '#F59E0B' },
    { id: 'stage-won', name: 'Won', position: 4, color: '#10B981', isWon: true },
    { id: 'stage-lost', name: 'Lost', position: 5, color: '#EF4444', isLost: true },
  ]

  for (const stage of stageData) {
    await prisma.leadStage.upsert({
      where: { id: stage.id },
      update: {},
      create: {
        id: stage.id,
        pipelineId: salesPipeline.id,
        name: stage.name,
        position: stage.position,
        color: stage.color,
        isWon: stage.isWon ?? false,
        isLost: stage.isLost ?? false,
      },
    })
  }

  console.log('✅ Pipelines & stages created')

  // ── WhatsApp Account ───────────────────────────────────
  const waAccount = await prisma.whatsAppAccount.upsert({
    where: { id: 'wa-account-001' },
    update: {},
    create: {
      id: 'wa-account-001',
      name: 'Sales WhatsApp',
      phoneNumber: '+91 9999999999',
      description: 'Primary sales WhatsApp number',
      createdById: admin.id,
    },
  })

  console.log('✅ WhatsApp account created')

  // ── Tags ───────────────────────────────────────────────
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: 'hot' }, update: {}, create: { name: 'hot', color: '#EF4444' } }),
    prisma.tag.upsert({ where: { name: 'warm' }, update: {}, create: { name: 'warm', color: '#F59E0B' } }),
    prisma.tag.upsert({ where: { name: 'cold' }, update: {}, create: { name: 'cold', color: '#3B82F6' } }),
    prisma.tag.upsert({ where: { name: 'vip' }, update: {}, create: { name: 'vip', color: '#8B5CF6' } }),
    prisma.tag.upsert({ where: { name: 'bulk-order' }, update: {}, create: { name: 'bulk-order', color: '#10B981' } }),
  ])

  console.log('✅ Tags created')

  // ── Contacts ───────────────────────────────────────────
  const contactsData = [
    { name: 'Amit Mehta', phone: '+919876543210', email: 'amit@example.com', company: 'Mehta Traders', source: 'website', utmSource: 'google', utmMedium: 'cpc' },
    { name: 'Sunita Patel', phone: '+919876543211', email: 'sunita@example.com', company: 'Patel Enterprises', source: 'referral' },
    { name: 'Vijay Reddy', phone: '+919876543212', email: 'vijay@example.com', company: 'Reddy & Sons', source: 'instagram' },
    { name: 'Meera Nair', phone: '+919876543213', email: 'meera@example.com', company: 'Nair Exports', source: 'website', utmCampaign: 'summer-2026' },
    { name: 'Karan Singh', phone: '+919876543214', email: 'karan@example.com', company: 'Singh Wholesale', source: 'cold-call' },
    { name: 'Deepa Joshi', phone: '+919876543215', email: 'deepa@example.com', source: 'whatsapp' },
    { name: 'Rahul Gupta', phone: '+919876543216', email: 'rahul@example.com', company: 'Gupta Industries', source: 'website' },
    { name: 'Lakshmi Iyer', phone: '+919876543217', email: 'lakshmi@example.com', source: 'referral' },
    { name: 'Manoj Tiwari', phone: '+919876543218', email: 'manoj@example.com', company: 'Tiwari Group', source: 'trade-show' },
    { name: 'Pooja Bansal', phone: '+919876543219', email: 'pooja@example.com', source: 'website' },
  ]

  const contacts = []
  for (const c of contactsData) {
    const contact = await prisma.contact.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        ...c,
        createdById: admin.id,
      },
    })
    contacts.push(contact)
  }

  console.log('✅ Contacts created')

  // ── Leads ──────────────────────────────────────────────
  const leadConfigs = [
    { contactIdx: 0, stageId: 'stage-new', assignedId: agent1.id, title: 'Office supplies bulk order' },
    { contactIdx: 1, stageId: 'stage-contacted', assignedId: agent1.id, title: 'Monthly procurement contract' },
    { contactIdx: 2, stageId: 'stage-qualified', assignedId: agent2.id, title: 'Export packaging materials' },
    { contactIdx: 3, stageId: 'stage-proposal', assignedId: agent2.id, title: 'Annual supply agreement' },
    { contactIdx: 4, stageId: 'stage-new', assignedId: agent1.id, title: 'Wholesale product inquiry' },
    { contactIdx: 5, stageId: 'stage-contacted', assignedId: agent1.id, title: 'Product samples request' },
    { contactIdx: 6, stageId: 'stage-qualified', assignedId: agent2.id, title: 'Custom order manufacturing' },
    { contactIdx: 7, stageId: 'stage-proposal', assignedId: agent1.id, title: 'Service contract renewal' },
    { contactIdx: 8, stageId: 'stage-won', assignedId: agent2.id, title: 'Trade show follow-up order', status: 'won' as const },
    { contactIdx: 9, stageId: 'stage-new', assignedId: agent1.id, title: 'Initial consultation' },
  ]

  const leads = []
  for (const lc of leadConfigs) {
    const contact = contacts[lc.contactIdx]!
    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        pipelineId: salesPipeline.id,
        stageId: lc.stageId,
        assignedToId: lc.assignedId,
        createdById: admin.id,
        title: lc.title,
        status: lc.status ?? 'active',
        source: contact.source,
        stageMovedAt: new Date(),
      },
    })
    leads.push(lead)

    // Activity log entry
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: admin.id,
        type: 'lead_created',
        description: `Lead created: ${lc.title}`,
      },
    })
  }

  console.log('✅ Leads created')

  // ── Message Templates ──────────────────────────────────
  await prisma.messageTemplate.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'First Contact',
        body: 'Hi {{contact_name}}! 👋 Thanks for your interest. I\'m {{agent_name}} from our sales team. How can I help you today?',
        category: 'intro',
        variables: JSON.parse('["contact_name","agent_name"]'),
        shortcut: '/intro',
        createdById: admin.id,
      },
      {
        name: 'Follow Up',
        body: 'Hi {{contact_name}}, just following up on our conversation. Do you have any questions I can help with?',
        category: 'follow-up',
        variables: JSON.parse('["contact_name"]'),
        shortcut: '/fu',
        createdById: admin.id,
      },
      {
        name: 'Proposal Sent',
        body: 'Hi {{contact_name}}, I\'ve sent over our proposal for your review. Please let me know if you have any questions! 📋',
        category: 'proposal',
        variables: JSON.parse('["contact_name"]'),
        shortcut: '/proposal',
        createdById: admin.id,
      },
      {
        name: 'Payment Reminder',
        body: 'Hi {{contact_name}}, just a gentle reminder that payment for Order #{{order_number}} (₹{{amount}}) is pending. Please let us know if you need any help! 🙏',
        category: 'payment',
        variables: JSON.parse('["contact_name","order_number","amount"]'),
        shortcut: '/pay',
        createdById: admin.id,
      },
      {
        name: 'Order Confirmed',
        body: 'Great news {{contact_name}}! 🎉 Your order #{{order_number}} has been confirmed. We\'ll keep you updated on the status.',
        category: 'order',
        variables: JSON.parse('["contact_name","order_number"]'),
        shortcut: '/confirm',
        createdById: admin.id,
      },
    ],
  })

  console.log('✅ Message templates created')

  // ── Sample Order ───────────────────────────────────────
  const orderLead = leads[8]! // Won lead
  const orderContact = contacts[8]!

  const order = await prisma.order.create({
    data: {
      leadId: orderLead.id,
      contactId: orderContact.id,
      createdById: admin.id,
      orderNumber: 'ORD-2026-001',
      status: 'confirmed',
      total: 45000,
      notes: 'Bulk order for trade show products',
      items: {
        create: [
          { name: 'Product A', quantity: 100, unitPrice: 250, total: 25000 },
          { name: 'Product B', quantity: 50, unitPrice: 400, total: 20000 },
        ],
      },
      payments: {
        create: {
          amount: 22500,
          method: 'bank_transfer',
          status: 'partial',
          reference: 'TXN2026001',
          paidAt: new Date(),
        },
      },
    },
  })

  console.log('✅ Sample order created')

  // ── Reminders ──────────────────────────────────────────
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  await prisma.reminder.create({
    data: {
      leadId: leads[0]!.id,
      createdById: admin.id,
      assignedToId: agent1.id,
      note: 'Call Amit to discuss office supplies requirements',
      dueAt: tomorrow,
    },
  })

  const todayNoon = new Date()
  todayNoon.setHours(14, 0, 0, 0)

  await prisma.reminder.create({
    data: {
      leadId: leads[3]!.id,
      createdById: admin.id,
      assignedToId: agent2.id,
      note: 'Follow up on annual supply agreement proposal',
      dueAt: todayNoon,
    },
  })

  console.log('✅ Reminders created')

  // ── Tasks ──────────────────────────────────────────────
  await prisma.task.create({
    data: {
      leadId: leads[1]!.id,
      createdById: admin.id,
      assignedToId: agent1.id,
      title: 'Prepare pricing sheet for Sunita',
      description: 'Include volume discount tiers for monthly procurement',
      priority: 'high',
      status: 'todo',
      dueAt: tomorrow,
    },
  })

  await prisma.task.create({
    data: {
      leadId: leads[2]!.id,
      createdById: admin.id,
      assignedToId: agent2.id,
      title: 'Send product catalog',
      status: 'in_progress',
      priority: 'medium',
    },
  })

  console.log('✅ Tasks created')

  console.log('\n✅ Seed complete!')
  console.log('\nLogin credentials:')
  console.log('  Admin:   admin@crm.local / admin123')
  console.log('  Manager: manager@crm.local / agent123')
  console.log('  Agent 1: ravi@crm.local / agent123')
  console.log('  Agent 2: priya@crm.local / agent123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
