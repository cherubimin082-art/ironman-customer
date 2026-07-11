pipeline {
    agent any

    stages {
        stage('Install') {
            steps {
                sh 'npm install --legacy-peer-deps --silent'
                sh 'cd backend && npm install --legacy-peer-deps --silent'
            }
        }
        stage('Build') {
            steps {
                sh 'rm -rf dist && npm run build --silent'
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                    set -e
                    mkdir -p /var/www/ironman-customer
                    rm -rf /var/www/ironman-customer/dist /var/www/ironman-customer/backend
                    cp -r dist /var/www/ironman-customer/
                    cp -r backend /var/www/ironman-customer/
                    sed -i 's|</head>|<meta http-equiv="Cache-Control" content="no-cache,no-store,must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0"></head>|' /var/www/ironman-customer/dist/index.html

                    pm2 delete smart-iron-customer || true
                    API_PORT=$(grep -m1 '^PORT=' /var/www/ironman-customer/backend/.env | cut -d= -f2)
                    API_PORT=${API_PORT:-5001}
                    # Best-effort: clear anything else still bound to the port (e.g. a
                    # process pm2 lost track of under a different name). Non-fatal if
                    # the Jenkins user lacks permission to kill it.
                    fuser -k ${API_PORT}/tcp 2>/dev/null || true
                    sleep 1

                    pm2 start /var/www/ironman-customer/backend/server.js --name smart-iron-customer
                    sleep 3

                    # Fail the build loudly instead of reporting false success if the
                    # freshly restarted API isn't actually answering - a stale process
                    # silently surviving a "successful" deploy has bitten this pipeline
                    # before.
                    if ! curl -sf "http://localhost:${API_PORT}/api/health" > /dev/null; then
                        echo "DEPLOY VERIFICATION FAILED: API not responding on port ${API_PORT} after restart."
                        pm2 logs smart-iron-customer --lines 40 --nostream || true
                        exit 1
                    fi
                    echo "Deploy verified: API responding on port ${API_PORT}."
                '''
            }
        }
    }

    post {
        success { echo 'Customer deployed to dev.ironman.today!' }
        failure { echo 'Deployment failed — check logs above.' }
    }
}
