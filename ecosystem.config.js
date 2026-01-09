module.exports = {
    apps: [{
        name: 'smartgrader-v2',
        script: 'node_modules/.bin/next',
        args: 'start -H 0.0.0.0 -p 23456',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 23456
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        // 自动重启配置
        min_uptime: '10s',
        max_restarts: 10,
        // 监控配置
        listen_timeout: 10000,
        kill_timeout: 5000
    }]
}
