import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Admin
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLogin.vue'),
    },
    {
      path: '/admin',
      component: () => import('@/components/layout/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/admin/servers' },
        { path: 'servers', name: 'admin-servers', component: () => import('@/views/admin/servers/ServerList.vue') },
        { path: 'servers/new', name: 'admin-server-create', component: () => import('@/views/admin/servers/ServerCreate.vue') },
        { path: 'servers/:id', name: 'admin-server-detail', component: () => import('@/views/admin/servers/ServerDetail.vue') },
        { path: 'instances', name: 'admin-instances', component: () => import('@/views/admin/instances/InstanceList.vue') },
        { path: 'instances/new', name: 'admin-instance-create', component: () => import('@/views/admin/instances/InstanceCreate.vue') },
        { path: 'instances/:id', name: 'admin-instance-detail', component: () => import('@/views/admin/instances/InstanceDetail.vue') },
        // legacy: /admin/servers/edit/?id=BongLauncher
        { path: 'servers/edit/', redirect: (to) => ({ path: `/admin/servers/${to.query.id}` }) },
      ],
    },
    // User
    {
      path: '/',
      component: () => import('@/components/layout/UserLayout.vue'),
      children: [
        { path: '', name: 'home', component: () => import('@/views/user/HomeView.vue') },
      ],
    },
  ],
})

export default router
