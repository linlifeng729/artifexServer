module.exports = {
  apps: [
    {
      name: 'artifexServer',
      script: './server/main.js',
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 12600
      }
    }
  ]
}; 