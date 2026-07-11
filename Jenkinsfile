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
                    # A stale process from before this pipeline existed ("customer-api")
                    # runs the same port. pm2's auto-restart resurrects it the instant
                    # fuser kills it, racing our own pm2 start below and silently winning
                    # the port - every deploy since would have "succeeded" while this old
                    # process kept serving all traffic. Delete it from pm2 entirely (not
                    # just kill -9) so there's nothing left to resurrect it.
                    pm2 delete customer-api || true
                    API_PORT=$(grep -m1 '^PORT=' /var/www/ironman-customer/backend/.env | cut -d= -f2)
                    API_PORT=${API_PORT:-5001}
                    fuser -k ${API_PORT}/tcp 2>/dev/null || true
                    sleep 1

                    pm2 start /var/www/ironman-customer/backend/server.js --name smart-iron-customer
                    sleep 3

                    # Fail loudly instead of reporting false success if the API isn't
                    # answering, AND verify the process actually bound to the port is
                    # ours - a health check alone doesn't prove that (any process
                    # answering /api/health looks the same from outside).
                    if ! curl -sf "http://localhost:${API_PORT}/api/health" > /dev/null; then
                        echo "DEPLOY VERIFICATION FAILED: API not responding on port ${API_PORT} after restart."
                        pm2 logs smart-iron-customer --lines 40 --nostream || true
                        exit 1
                    fi
                    OUR_PID=$(pm2 jlist | node -e "process.stdin.on('data',d=>{const p=JSON.parse(d).find(x=>x.name==='smart-iron-customer');console.log(p?p.pid:'')})")
                    PORT_PID=$(fuser ${API_PORT}/tcp 2>/dev/null | tr -d ' ' || echo "")
                    if [ -z "$OUR_PID" ] || [ "$OUR_PID" != "$PORT_PID" ]; then
                        echo "DEPLOY VERIFICATION FAILED: something else is bound to port ${API_PORT} (pid $PORT_PID), not smart-iron-customer (pid $OUR_PID)."
                        pm2 list
                        exit 1
                    fi
                    echo "Deploy verified: smart-iron-customer (pid $OUR_PID) is the process bound to port ${API_PORT}."
                '''
            }
        }
    }

    post {
        success { echo 'Customer deployed to dev.ironman.today!' }
        failure { echo 'Deployment failed — check logs above.' }
    }
}
