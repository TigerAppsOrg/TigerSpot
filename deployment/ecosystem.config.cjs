// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'tigerspot-frontend',
      cwd: '/home/ubuntu/tigerspot/tigerspot-new',
      script: 'pnpm',
      args: 'preview --host --port 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/ubuntu/logs/frontend-error.log',
      out_file: '/home/ubuntu/logs/frontend-out.log',
      time: true
    },
    {
      name: 'tigerspot-backend',
      cwd: '/home/ubuntu/tigerspot/server',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/ubuntu/logs/backend-error.log',
      out_file: '/home/ubuntu/logs/backend-out.log',
      time: true
    }
  ]
};
